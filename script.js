document.addEventListener("DOMContentLoaded", async function () {
    let db;
    const grid = document.querySelector(".image-grid");
    const gallery = document.getElementById("gallery");
    const mikaPage = document.getElementById("mika-page");
    const projectsPage = document.getElementById("projects-page");
    let isAdmin = false;

    // 🔥 Kolla om Firebase finns – annars använd en mockad databas
    if (typeof firebase !== "undefined") {
        db = firebase.database();
        console.log("✅ Firebase laddat!");
    } else {
        console.warn("⚠️ Firebase laddades inte – använder testläge!");
        db = {
            ref: () => ({
                once: async () => ({ val: () => [
                    "https://i.postimg.cc/vm3j97Jg/1.jpg",
                    "https://i.postimg.cc/fLqG475n/10.jpg"
                ] }),
                set: async () => console.log("Mock-databas: Sparad bildordning"),
            }),
        };
    }

    async function checkAdminStatus() {
        const snapshot = await db.ref("isAdmin").once("value");
        isAdmin = snapshot.val() || false;
    }

    async function loadImages() {
        grid.innerHTML = "";
        const snapshot = await db.ref("imageOrder").once("value");
        let savedOrder = snapshot.val() || [
            "https://i.postimg.cc/vm3j97Jg/1.jpg",
            "https://i.postimg.cc/fLqG475n/10.jpg"
        ];

        if (typeof savedOrder === "object" && !Array.isArray(savedOrder)) {
            savedOrder = Object.values(savedOrder);
        }

        savedOrder.forEach(src => {
            const wrapper = document.createElement("div");
            wrapper.classList.add("image-wrapper");
            if (isAdmin) wrapper.setAttribute("draggable", "true");

            const img = document.createElement("img");
            img.src = src;
            wrapper.appendChild(img);
            grid.appendChild(wrapper);
        });

        if (isAdmin) addDragAndDropListeners();
    }

    function addDragAndDropListeners() {
        let draggedItem = null;
        document.querySelectorAll(".image-wrapper").forEach(item => {
            item.addEventListener("dragstart", () => draggedItem = item);
            item.addEventListener("dragend", saveImageOrder);
            item.addEventListener("dragover", e => e.preventDefault());
            item.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedItem === item) return;
                grid.insertBefore(draggedItem, item);
                saveImageOrder();
            });
        });
    }

    async function saveImageOrder() {
        const newOrder = [...document.querySelectorAll(".image-wrapper img")].map(img => img.src);
        await db.ref("imageOrder").set(newOrder);
    }

    // 🔥 Adminläge med kortkommando Ctrl+H / Cmd+H
    document.addEventListener("keydown", async function (event) {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "h") {
            event.preventDefault();
            isAdmin = !isAdmin;
            await db.ref("isAdmin").set(isAdmin);
            alert(`Adminläge ${isAdmin ? "aktiverat" : "avaktiverat"}! Sidan laddas om.`);
            location.reload();
        }
    });

    // 🔥 Funktion för att växla mellan sidor
    function setActivePage(activePage) {
        // Dölj alla sidor
        gallery.style.display = "none";
        mikaPage.classList.remove("active");
        projectsPage.classList.remove("active");

        // Ta bort aktiv länk från alla menyknappar
        document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active-link"));

        // Visa den valda sidan och markera länken
        if (activePage === "gallery") {
            gallery.style.display = "block";
            document.getElementById("archive-link").classList.add("active-link");
        } else if (activePage === "mika") {
            mikaPage.classList.add("active");
            document.getElementById("mika-link").classList.add("active-link");
        } else if (activePage === "projects") {
            projectsPage.classList.add("active");
            document.getElementById("projects-link").classList.add("active-link");
        }
    }

    // 🔥 Event Listeners för navigeringsmenyn
    document.getElementById("archive-link").addEventListener("click", function (event) {
        event.preventDefault();
        setActivePage("gallery");
    });

    document.getElementById("mika-link").addEventListener("click", function (event) {
        event.preventDefault();
        setActivePage("mika");
    });

    document.getElementById("projects-link").addEventListener("click", function (event) {
        event.preventDefault();
        setActivePage("projects");
    });

    await checkAdminStatus();
    loadImages();
});