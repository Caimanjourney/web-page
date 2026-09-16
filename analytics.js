/*
 * PostHog analytics for Moirai.
 *
 * Setup: add the project token to <html data-posthog-project-token="..."> and
 * keep the API host aligned with the PostHog project's US/EU region. Tracking
 * remains off until a visitor accepts the optional analytics choice.
 */
(() => {
  const root = document.documentElement;
  const projectToken = root.dataset.posthogProjectToken?.trim();

  if (!projectToken) return;

  const apiHost = root.dataset.posthogApiHost?.trim() || "https://us.i.posthog.com";
  const consentKey = "moirai_analytics_consent";
  const consentPanel = document.querySelector("#analytics-consent");
  const acceptButton = document.querySelector("#analytics-accept");
  const declineButton = document.querySelector("#analytics-decline");
  const preferencesButton = document.querySelector("#analytics-preferences");
  const discoveryBookingKey = "moirai_discovery_booking_confirmed";
  let hasCapturedPageview = false;
  let hasCapturedDiscoveryBooking = false;
  const pendingEvents = [];
  const hasDiscoveryBookingConfirmation = new URLSearchParams(window.location.search).get("booking") === "confirmed";

  try {
    hasCapturedDiscoveryBooking = window.sessionStorage.getItem(discoveryBookingKey) === "true";
  } catch {
    // A reload may repeat the event only when session storage is unavailable.
  }

  if (hasDiscoveryBookingConfirmation) {
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.hash}`);
  }

  const readConsent = () => {
    try {
      return window.localStorage.getItem(consentKey);
    } catch {
      return null;
    }
  };

  const saveConsent = (value) => {
    try {
      window.localStorage.setItem(consentKey, value);
    } catch {
      // Tracking can still follow the current page choice if storage is unavailable.
    }
  };

  const clearConsent = () => {
    try {
      window.localStorage.removeItem(consentKey);
    } catch {
      // The panel is still shown, even when browser storage is unavailable.
    }
  };

  const setPanelVisibility = (isVisible) => {
    consentPanel?.classList.toggle("hidden", !isVisible);
  };

  const capture = (eventName, properties = {}) => {
    if (readConsent() !== "accepted") return;
    if (window.posthog?.capture) {
      window.posthog.capture(eventName, properties);
    } else {
      pendingEvents.push([eventName, properties]);
    }
  };

  const flushPendingEvents = () => {
    while (pendingEvents.length) {
      const [eventName, properties] = pendingEvents.shift();
      window.posthog?.capture?.(eventName, properties);
    }
  };

  const capturePageview = () => {
    if (hasCapturedPageview) return;
    hasCapturedPageview = true;
    capture("$pageview", { $current_url: `${window.location.origin}${window.location.pathname}` });
  };

  const captureDiscoveryBooking = () => {
    if (!hasDiscoveryBookingConfirmation || hasCapturedDiscoveryBooking) return;
    hasCapturedDiscoveryBooking = true;
    try {
      window.sessionStorage.setItem(discoveryBookingKey, "true");
    } catch {
      // The event remains consent-gated even when session storage is unavailable.
    }
    capture("discovery_session_booked");
  };

  window.MoiraiAnalytics = { capture };

  const enableAnalytics = (captureConsentEvent = false) => {
    window.posthog?.opt_in_capturing?.();
    window.posthog?.startSessionRecording?.();
    capturePageview();
    captureDiscoveryBooking();
    if (captureConsentEvent) capture("analytics consent updated", { choice: "accepted" });
  };

  const disableAnalytics = () => {
    window.posthog?.stopSessionRecording?.();
    window.posthog?.opt_out_capturing?.();
  };

  const applyStoredConsent = () => {
    const consent = readConsent();
    if (consent === "accepted") {
      enableAnalytics();
    } else if (consent === "declined") {
      disableAnalytics();
    } else {
      setPanelVisibility(true);
    }
  };

  acceptButton?.addEventListener("click", () => {
    saveConsent("accepted");
    enableAnalytics(true);
    setPanelVisibility(false);
  });

  declineButton?.addEventListener("click", () => {
    saveConsent("declined");
    disableAnalytics();
    setPanelVisibility(false);
  });

  preferencesButton?.addEventListener("click", () => {
    disableAnalytics();
    clearConsent();
    setPanelVisibility(true);
    acceptButton?.focus();
  });

  // This is the loader pattern from PostHog's HTML snippet, with privacy and
  // consent defaults appropriate for a site where visitors may share sensitive context.
  const script = document.createElement("script");
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `${apiHost.replace(".i.posthog.com", "-assets.i.posthog.com")}/static/array.js`;
  script.addEventListener("load", () => {
    window.posthog.init(projectToken, {
      api_host: apiHost,
      defaults: "2026-05-30",
      autocapture: true,
      capture_pageview: false,
      person_profiles: "never",
      opt_out_capturing_by_default: true,
      respect_dnt: true,
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "*",
        maskCapturedNetworkRequestFn: (request) => {
          if (request.name) request.name = request.name.split("?")[0];
          return request;
        },
      },
      loaded: applyStoredConsent,
    });
    flushPendingEvents();
  });
  document.head.appendChild(script);

  document.addEventListener("click", (event) => {
    const element = event.target.closest("[data-analytics-event]");
    if (!element) return;

    capture(element.dataset.analyticsEvent, {
      placement: element.dataset.analyticsPlacement || "unknown",
    });
  });

  const viewedSections = new Set();
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sectionName = entry.target.dataset.analyticsSection;
        if (!entry.isIntersecting || !sectionName || viewedSections.has(sectionName)) return;
        viewedSections.add(sectionName);
        capture("section viewed", { section: sectionName });
      });
    },
    { threshold: 0.5 },
  );

  document.querySelectorAll("[data-analytics-section]").forEach((section) => sectionObserver.observe(section));
})();
