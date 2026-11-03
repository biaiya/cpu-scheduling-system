const box = document.querySelector(".form-box");

if (box) {
    const items = Array.from(box.children);
    const link = box.querySelector(".switch a");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // which way we came from: 1 = going to signup, -1 = going to login
    const dir = sessionStorage.getItem("dir") || "0";
    sessionStorage.removeItem("dir");
    box.style.setProperty("--dir", dir);

    // a label and its input share one step, so they move together
    let step = -1;
    items.forEach((el) => {
        if (el.tagName !== "INPUT") step++;
        el.style.setProperty("--i", step);
    });
    const steps = step + 1;

    // play the exit cascade, then go to the other page
    if (link) {
        link.addEventListener("click", (e) => {
            if (reduce) return;
            e.preventDefault();

            const toSignup = link.getAttribute("href").includes("signup");
            const d = toSignup ? "1" : "-1";
            sessionStorage.setItem("dir", d);
            box.style.setProperty("--dir", d);
            box.classList.add("leaving");

            setTimeout(() => {
                window.location.href = link.href;
            }, 320 + steps * 30);
        });
    }

    // if the browser restores the page from cache with the back button
    window.addEventListener("pageshow", (e) => {
        if (e.persisted) box.classList.remove("leaving");
    });
}