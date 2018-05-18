require("babel-polyfill");
require("whatwg-fetch");

const appState = {};

async function getDB () {
    return fetch("./gen/db.json")
        // .then(response => JSON.parse(response.text()))
        .then(response => response.text())
        .then(text => JSON.parse(text));
}

async function openPage (page) {
    const mainContent = document.getElementById("main-content");
    const html = await fetch(page.url)
        .then(response => response.text());

    mainContent.innerHTML = renderPage(page.title, page.author, page.date, html);

    appState.menuBlog.className = "";
    if (appState.selectedPage) {
        appState.selectedPage.menuItem.className = "";
    }

    appState.selectedPage = page;
    page.menuItem.className = "selected";
}

function renderPage (title, author, date, html) {
    return `<div class='content'>
            <div class='content-header'>
                <div class='content-title'>
                    ${title}
                </div>
                <div class='content-subtitle'>
                    <div class='content-author'>${author}</div>
                    <div class='content-date'>${date.substr(0, 10)}</div>
                </div>
            </div>
            <div class='content-body'>
                ${html}
            </div>
        </div>
    `
}

async function openBlog (db) {
    const mainContent = document.getElementById("main-content");
    const posts = db.posts;
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    mainContent.innerHTML = "";

    for (let i=0; i<posts.length; i++) {
        const post = posts[i];
        const html = await fetch(post.url)
            .then(response => response.text());

        mainContent.innerHTML += renderPage(
            post.title,
            post.author,
            post.date,
            html
        );
    }

    appState.menuBlog.className = "selected";
    if (appState.selectedPage) {
        appState.selectedPage.menuItem.className = "";
        delete appState.selectedPage;
    }
}


function makeMenu (db) {
    const menu = document.getElementById("menu");
    const pages = db.pages;
    menu.innerHTML = "";

    const menuBlog = document.createElement("li");
    appState.menuBlog = menuBlog;
    menuBlog.innerHTML = "blog";
    menuBlog.onclick = () => openBlog(db);
    menu.appendChild(menuBlog);

    openBlog(db);

    for (let i=0; i<pages.length; i++) {
        const page = pages[i];
        const menuItem = document.createElement("li");
        page.menuItem = menuItem;
        menuItem.innerHTML = page.title;
        menuItem.onclick = () => openPage(page);
        menu.appendChild(menuItem);
    }
}

async function start () {
    const db = await getDB();

    makeMenu(db);
}

start();

