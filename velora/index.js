/* ============================================================
   Velora: store logic
   Cart, saved items and theme are kept in localStorage.
   ============================================================ */

var IMG = "https://images.unsplash.com/photo-";
var FREE_SHIPPING = 15000;

/* ---------- Product data ---------- */
var products = [
    { id: 1,  name: "Linen Camp Shirt",     cat: "men",         price: 7900,  img: "1576566588028-4147f3842f27", hue: 210, sizes: ["S","M","L","XL"], tag: "New",  desc: "A relaxed short-sleeve shirt in breathable linen. Wear it open over a tee or buttoned up." },
    { id: 2,  name: "Heavy Cotton Tee",     cat: "men",         price: 3900,  img: "1521572163474-6864f9cf17ab", hue: 20,  sizes: ["S","M","L","XL"], desc: "A thick 240 gsm cotton tee that holds its shape wash after wash." },
    { id: 3,  name: "Stonewash Overshirt",  cat: "men",         price: 12900, oldPrice: 15900, img: "1591047139829-d91aecb6caea", hue: 200, sizes: ["M","L","XL"], tag: "Sale", desc: "A soft washed overshirt that works as a light jacket on cooler evenings." },
    { id: 4,  name: "Tailored Blazer",      cat: "women",       price: 18900, img: "1594938298603-c8148c4dae35", hue: 280, sizes: ["XS","S","M","L"], desc: "A sharp, lightly structured blazer with a clean line from shoulder to hem." },
    { id: 5,  name: "Wrap Midi Dress",      cat: "women",       price: 11900, img: "1515886657613-9f3515b0c78f", hue: 340, sizes: ["XS","S","M","L"], tag: "New",  desc: "A flowing wrap dress that ties at the waist and moves well in the heat." },
    { id: 6,  name: "Ribbed Knit Top",      cat: "women",       price: 4900,  img: "1434389677669-e08b4cac3105", hue: 45,  sizes: ["XS","S","M","L"], desc: "A stretchy ribbed top you can dress up or down." },
    { id: 7,  name: "Wide-leg Trousers",    cat: "women",       price: 8900,  oldPrice: 10900, img: "1490481651871-ab68de25d43d", hue: 160, sizes: ["XS","S","M","L"], tag: "Sale", desc: "High-waisted trousers with a wide, easy leg and a soft drape." },
    { id: 8,  name: "Daily Court Sneaker",  cat: "shoes",       price: 14900, img: "1491553895911-0055eca6402d", hue: 190, sizes: ["38","39","40","41","42","43","44","45"], desc: "A clean low-top sneaker for every day, with a cushioned insole." },
    { id: 9,  name: "Street Runner",        cat: "shoes",       price: 16900, img: "1542291026-7eec264c27ff", hue: 5,   sizes: ["39","40","41","42","43","44"], tag: "New",  desc: "A light runner with a grippy sole, made for long walks and short sprints." },
    { id: 10, name: "Canvas Tote",          cat: "accessories", price: 3500,  img: "1584917865442-de89df76afd3", hue: 70,  sizes: ["One size"], desc: "A sturdy canvas tote with an inside pocket. Fits a laptop and your lunch." },
    { id: 11, name: "Leather Crossbody",    cat: "accessories", price: 9900,  img: "1548036328-c9fa89d128fa", hue: 25,  sizes: ["One size"], desc: "A compact crossbody bag with an adjustable strap and a magnetic clasp." },
    { id: 12, name: "Soft Wool Scarf",      cat: "accessories", price: 4500,  img: "1523381210434-271e8be1f52b", hue: 300, sizes: ["One size"], desc: "A light wool scarf for air-conditioned rooms and cool mornings." }
];

/* ---------- Small helpers ---------- */
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
function money(n) { return "Rs " + n.toLocaleString("en-US"); }
function byId(id) { return products.filter(function (p) { return p.id === id; })[0]; }

function load(key, fallback) {
    try {
        var v = JSON.parse(localStorage.getItem(key));
        return v === null || v === undefined ? fallback : v;
    } catch (e) { return fallback; }
}
function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage blocked: ignore */ }
}

var state = {
    cat: "all",
    q: "",
    sale: false,
    sort: "featured",
    cart: load("velora-cart", []),   // [{id, size, qty}]
    wish: load("velora-wish", []),   // [id, id, ...]
    modalId: null,
    modalSize: null
};

/* ---------- Toast ---------- */
var toastTimer;
function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2400);
}

/* ---------- Overlays (side menu, bag, modal) ---------- */
var scrim = $("#scrim");
var sideNav = $("#sideNav");
var drawer = $("#drawer");
var modal = $("#modal");
var lastFocus = null;

function anyOpen() {
    return sideNav.classList.contains("open") || drawer.classList.contains("open") || modal.classList.contains("open");
}
function syncLock() { document.body.classList.toggle("lock", anyOpen()); }

function openPanel(el, withScrim) {
    lastFocus = document.activeElement;
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
    if (withScrim) {
        scrim.hidden = false;
        requestAnimationFrame(function () { scrim.classList.add("show"); });
    }
    syncLock();
    var first = el.querySelector("button, a, input");
    if (first) setTimeout(function () { first.focus(); }, 60);
}
function closePanel(el) {
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
    if (!sideNav.classList.contains("open") && !drawer.classList.contains("open")) {
        scrim.classList.remove("show");
        setTimeout(function () { if (!scrim.classList.contains("show")) scrim.hidden = true; }, 300);
    }
    syncLock();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function showNavbar() { openPanel(sideNav, true); }
function closeNavbar() { closePanel(sideNav); }
function openCart() { renderCart(); openPanel(drawer, true); }
function closeCart() { closePanel(drawer); }

$("#menuOpen").addEventListener("click", showNavbar);
$("#menuClose").addEventListener("click", closeNavbar);
$("#cartBtn").addEventListener("click", openCart);
$("#drawerClose").addEventListener("click", closeCart);
scrim.addEventListener("click", function () {
    if (sideNav.classList.contains("open")) closeNavbar();
    if (drawer.classList.contains("open")) closeCart();
});
$$(".side-navbar-links a").forEach(function (a) { a.addEventListener("click", closeNavbar); });

document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (modal.classList.contains("open")) closeModal();
    else if (drawer.classList.contains("open")) closeCart();
    else if (sideNav.classList.contains("open")) closeNavbar();
});

/* ---------- Product grid ---------- */
var heartSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-9.2-9.3C1.7 7.4 3.6 4.5 6.7 4.5c1.9 0 3.4 1 5.3 3 1.9-2 3.4-3 5.3-3 3.1 0 5 2.9 3.9 6.2C19.5 15.4 12 20 12 20Z"/></svg>';

function visibleProducts() {
    var q = state.q.trim().toLowerCase();
    var list = products.filter(function (p) {
        var okCat = state.cat === "all" || p.cat === state.cat;
        var okSale = !state.sale || !!p.oldPrice;
        var okQ = !q || p.name.toLowerCase().indexOf(q) !== -1 || p.cat.indexOf(q) !== -1;
        return okCat && okQ && okSale;
    });
    if (state.sort === "low") list.sort(function (a, b) { return a.price - b.price; });
    if (state.sort === "high") list.sort(function (a, b) { return b.price - a.price; });
    if (state.sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    return list;
}

function renderProducts() {
    var list = visibleProducts();
    var grid = $("#productGrid");

    grid.innerHTML = list.map(function (p) {
        var saved = state.wish.indexOf(p.id) !== -1;
        var tag = p.tag ? '<span class="tag' + (p.tag === "Sale" ? " sale" : "") + '">' + p.tag + "</span>" : "";
        var price = p.oldPrice ? "<s>" + money(p.oldPrice) + "</s>" + money(p.price) : money(p.price);
        return '' +
            '<article class="card">' +
              '<div class="card-img ph" style="--h:' + p.hue + '">' +
                '<img src="' + IMG + p.img + '?w=600&q=80" alt="' + p.name + '" loading="lazy" onerror="this.remove()">' +
                tag +
                '<button class="heart' + (saved ? " on" : "") + '" data-heart="' + p.id + '" aria-pressed="' + saved + '" aria-label="' + (saved ? "Remove " : "Save ") + p.name + (saved ? " from saved items" : " to saved items") + '">' + heartSvg + '</button>' +
              '</div>' +
              '<div class="card-body">' +
                '<div><h3>' + p.name + '</h3><p class="cat">' + p.cat + '</p></div>' +
                '<p class="price">' + price + '</p>' +
              '</div>' +
              '<button class="btn btn-ghost" data-open="' + p.id + '">Choose size</button>' +
            '</article>';
    }).join("");

    $("#empty").hidden = list.length > 0;
    $("#resultCount").textContent = list.length + (list.length === 1 ? " product" : " products") + (state.sale ? " on sale" : "");
}

$("#productGrid").addEventListener("click", function (e) {
    var heart = e.target.closest("[data-heart]");
    if (heart) { toggleWish(Number(heart.getAttribute("data-heart"))); return; }
    var open = e.target.closest("[data-open]");
    if (open) openModal(Number(open.getAttribute("data-open")));
});

/* ---------- Filters ---------- */
function setCategory(cat) {
    state.cat = cat;
    state.sale = false;
    $$(".chip").forEach(function (c) {
        var on = c.getAttribute("data-cat") === cat;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", on);
    });
    renderProducts();
}

$("#chips").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (chip) setCategory(chip.getAttribute("data-cat"));
});
$("#searchInput").addEventListener("input", function (e) { state.q = e.target.value; renderProducts(); });
$("#sortSelect").addEventListener("change", function (e) { state.sort = e.target.value; renderProducts(); });
$("#clearFilters").addEventListener("click", function () {
    state.q = ""; state.sort = "featured"; state.sale = false;
    $("#searchInput").value = ""; $("#sortSelect").value = "featured";
    setCategory("all");
});

// category tiles and footer links jump to the shop with that filter on
$$("[data-cat]").forEach(function (el) {
    if (el.classList.contains("chip")) return;
    el.addEventListener("click", function () { setCategory(el.getAttribute("data-cat")); });
});

$("#searchBtn").addEventListener("click", function () {
    $("#shop").scrollIntoView({ behavior: "smooth" });
    setTimeout(function () { $("#searchInput").focus(); }, 500);
});

$("#saleBtn").addEventListener("click", function () {
    setCategory("all");
    state.sale = true;
    renderProducts();
    $("#shop").scrollIntoView({ behavior: "smooth" });
});

/* ---------- Saved items ---------- */
function toggleWish(id) {
    var i = state.wish.indexOf(id);
    if (i === -1) { state.wish.push(id); toast("Saved " + byId(id).name); }
    else { state.wish.splice(i, 1); toast("Removed from saved items"); }
    save("velora-wish", state.wish);
    renderProducts();
    updateBadges();
}

$("#wishBtn").addEventListener("click", function () {
    if (!state.wish.length) { toast("Tap the heart on a product to save it"); return; }
    toast("You have " + state.wish.length + " saved " + (state.wish.length === 1 ? "item" : "items"));
});

/* ---------- Quick view ---------- */
function openModal(id) {
    var p = byId(id);
    state.modalId = id;
    state.modalSize = p.sizes.length === 1 ? p.sizes[0] : null;

    $("#mName").textContent = p.name;
    $("#mPrice").innerHTML = p.oldPrice ? "<s>" + money(p.oldPrice) + "</s>" + money(p.price) : money(p.price);
    $("#mDesc").textContent = p.desc;
    $("#mMsg").textContent = "";
    $("#mMsg").className = "form-msg";
    $("#mImg").style.setProperty("--h", p.hue);
    $("#mImg").innerHTML = '<img src="' + IMG + p.img + '?w=900&q=80" alt="' + p.name + '" onerror="this.remove()">';

    $("#mSizes").innerHTML = p.sizes.map(function (s) {
        return '<button class="size' + (state.modalSize === s ? " is-on" : "") + '" data-size="' + s + '" aria-pressed="' + (state.modalSize === s) + '">' + s + "</button>";
    }).join("");

    openPanel(modal, false);
}
function closeModal() { closePanel(modal); }

$("#mSizes").addEventListener("click", function (e) {
    var b = e.target.closest("[data-size]");
    if (!b) return;
    state.modalSize = b.getAttribute("data-size");
    $$("#mSizes .size").forEach(function (s) {
        var on = s === b;
        s.classList.toggle("is-on", on);
        s.setAttribute("aria-pressed", on);
    });
    $("#mMsg").textContent = "";
});
$("#modalClose").addEventListener("click", closeModal);
modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

$("#mAdd").addEventListener("click", function () {
    if (!state.modalSize) {
        $("#mMsg").textContent = "Choose a size first.";
        $("#mMsg").className = "form-msg error";
        return;
    }
    addToCart(state.modalId, state.modalSize);
    closeModal();
    openCart();
});

/* ---------- Bag ---------- */
function addToCart(id, size) {
    var found = state.cart.filter(function (l) { return l.id === id && l.size === size; })[0];
    if (found) found.qty += 1; else state.cart.push({ id: id, size: size, qty: 1 });
    persistCart();
    toast("Added " + byId(id).name + " to your bag");
}

function persistCart() {
    save("velora-cart", state.cart);
    renderCart();
    updateBadges();
}

function cartTotal() {
    return state.cart.reduce(function (sum, l) { return sum + byId(l.id).price * l.qty; }, 0);
}

function renderCart() {
    var list = $("#cartList");
    list.innerHTML = state.cart.map(function (l, i) {
        var p = byId(l.id);
        return '' +
            '<li class="cart-item">' +
              '<div class="cart-thumb ph" style="--h:' + p.hue + '"><img src="' + IMG + p.img + '?w=200&q=70" alt="" onerror="this.remove()"></div>' +
              '<div>' +
                '<h4>' + p.name + '</h4>' +
                '<small>Size ' + l.size + ' · ' + money(p.price) + '</small><br>' +
                '<div class="qty">' +
                  '<button data-dec="' + i + '" aria-label="Decrease quantity">−</button>' +
                  '<span aria-live="polite">' + l.qty + '</span>' +
                  '<button data-inc="' + i + '" aria-label="Increase quantity">+</button>' +
                '</div>' +
              '</div>' +
              '<button class="remove" data-remove="' + i + '">Remove</button>' +
            '</li>';
    }).join("");

    var total = cartTotal();
    $("#subtotal").textContent = money(total);
    $("#cartEmpty").hidden = state.cart.length > 0;
    $("#checkoutBtn").disabled = state.cart.length === 0;

    var left = FREE_SHIPPING - total;
    $("#shipMsg").textContent = total === 0 ? "Free shipping on orders over " + money(FREE_SHIPPING)
        : left > 0 ? "Add " + money(left) + " more for free shipping"
        : "You get free shipping";
    $("#shipFill").style.width = Math.min(100, (total / FREE_SHIPPING) * 100) + "%";
}

$("#cartList").addEventListener("click", function (e) {
    var inc = e.target.closest("[data-inc]");
    var dec = e.target.closest("[data-dec]");
    var rem = e.target.closest("[data-remove]");
    if (inc) state.cart[Number(inc.getAttribute("data-inc"))].qty += 1;
    else if (dec) {
        var l = state.cart[Number(dec.getAttribute("data-dec"))];
        l.qty -= 1;
        if (l.qty <= 0) state.cart.splice(Number(dec.getAttribute("data-dec")), 1);
    }
    else if (rem) state.cart.splice(Number(rem.getAttribute("data-remove")), 1);
    else return;
    persistCart();
});

$("#checkoutBtn").addEventListener("click", function () {
    toast("This is a demo store. Checkout is not connected yet.");
});

function updateBadges() {
    var count = state.cart.reduce(function (n, l) { return n + l.qty; }, 0);
    var cc = $("#cartCount"), wc = $("#wishCount");
    cc.textContent = count; cc.hidden = count === 0;
    wc.textContent = state.wish.length; wc.hidden = state.wish.length === 0;
}

/* ---------- Dark mode ---------- */
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $("#themeBtn").setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}
(function initTheme() {
    var saved = load("velora-theme", null);
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
})();
$("#themeBtn").addEventListener("click", function () {
    var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    save("velora-theme", next);
});

/* ---------- Sale countdown (ends Sunday 23:59:59) ---------- */
function saleEnd() {
    var d = new Date();
    var daysToSunday = (7 - d.getDay()) % 7;
    var end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + daysToSunday, 23, 59, 59);
    if (end < d) end.setDate(end.getDate() + 7);
    return end;
}
var endTime = saleEnd();
function tick() {
    var diff = Math.max(0, endTime - new Date());
    var s = Math.floor(diff / 1000);
    function pad(n) { return String(n).padStart(2, "0"); }
    $("#cdD").textContent = Math.floor(s / 86400);
    $("#cdH").textContent = pad(Math.floor((s % 86400) / 3600));
    $("#cdM").textContent = pad(Math.floor((s % 3600) / 60));
    $("#cdS").textContent = pad(s % 60);
    if (diff === 0) endTime = saleEnd();
}
tick();
setInterval(tick, 1000);

/* ---------- Newsletter ---------- */
$("#newsForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("#newsEmail").value.trim();
    var msg = $("#newsMsg");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        msg.textContent = "Enter a valid email address, like name@example.com.";
        msg.className = "form-msg error";
        return;
    }
    msg.textContent = "Thanks! You are on the list.";
    msg.className = "form-msg ok";
    $("#newsEmail").value = "";
});

/* ---------- Hero parallax (mouse only) ---------- */
(function heroTilt() {
    var stack = $("#heroStack");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!stack || reduce) return;
    stack.addEventListener("mousemove", function (e) {
        var r = stack.getBoundingClientRect();
        stack.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        stack.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    stack.addEventListener("mouseleave", function () {
        stack.style.setProperty("--mx", 0);
        stack.style.setProperty("--my", 0);
    });
})();

/* ---------- Back to top ---------- */
var toTop = $("#toTop");
window.addEventListener("scroll", function () { toTop.hidden = window.scrollY < 700; }, { passive: true });
toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

/* ---------- Start ---------- */
$("#year").textContent = new Date().getFullYear();
renderProducts();
renderCart();
updateBadges();
