(function () {
    try {
        var t = localStorage.getItem("theme") || "dark";
        if (t === "system") {
            t = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        var d = document.documentElement;
        d.classList.remove("light", "dark");
        d.classList.add(t);
        if (t === "dark" || t === "light") {
            d.style.colorScheme = t;
        }
    } catch (e) { }
})();
