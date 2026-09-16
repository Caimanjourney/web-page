(() => {
  const siteHeader = document.querySelector("#site-header");

  if (siteHeader) {
    let previousScrollPosition = window.scrollY;
    let scrollDistance = 0;
    const scrollThreshold = 8;

    const updateHeader = () => {
      const currentScrollPosition = window.scrollY;
      const scrollChange = currentScrollPosition - previousScrollPosition;

      if (currentScrollPosition <= 8) {
        siteHeader.classList.remove("is-scrolled", "is-hidden");
        scrollDistance = 0;
      } else {
        siteHeader.classList.add("is-scrolled");
        scrollDistance += scrollChange;

        if (scrollDistance >= scrollThreshold) {
          siteHeader.classList.add("is-hidden");
          scrollDistance = 0;
        } else if (scrollDistance <= -scrollThreshold) {
          siteHeader.classList.remove("is-hidden");
          scrollDistance = 0;
        }
      }

      previousScrollPosition = currentScrollPosition;
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  const mobileMenu = document.querySelector("#mobile-menu");
  const mobileMenuToggle = document.querySelector("#mobile-menu-toggle");

  if (mobileMenu && mobileMenuToggle) {
    const menuIcons = mobileMenuToggle.querySelectorAll("[data-menu-icon]");
    let lastFocusedElement = null;

    const setMobileMenu = (isOpen) => {
      mobileMenu.classList.toggle("hidden", !isOpen);
      document.body.classList.toggle("overflow-hidden", isOpen);
      mobileMenuToggle.setAttribute("aria-expanded", String(isOpen));
      mobileMenuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
      menuIcons.forEach((icon) => icon.classList.toggle("hidden", icon.dataset.menuIcon === (isOpen ? "open" : "close")));

      if (isOpen) {
        lastFocusedElement = document.activeElement;
        mobileMenu.querySelector("a")?.focus();
      } else if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
      }
    };

    mobileMenuToggle.addEventListener("click", () => {
      const isOpening = mobileMenu.classList.contains("hidden");
      setMobileMenu(isOpening);
      if (isOpening) window.MoiraiAnalytics?.capture("navigation_menu_opened", { menu: "mobile" });
    });

    mobileMenu.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => setMobileMenu(false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !mobileMenu.classList.contains("hidden")) setMobileMenu(false);
    });

    window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
      if (event.matches && !mobileMenu.classList.contains("hidden")) setMobileMenu(false);
    });
  }

  const emblaRoot = document.querySelector("[data-embla]");
  if (emblaRoot && typeof EmblaCarousel === "function" && typeof EmblaCarouselAutoScroll === "function") {
    const viewportNode = emblaRoot.querySelector(".embla__viewport");
    EmblaCarousel(viewportNode, { loop: true }, [
      EmblaCarouselAutoScroll({
        speed: 1,
        playOnInit: true,
        stopOnInteraction: false,
      }),
    ]);
  }
})();
