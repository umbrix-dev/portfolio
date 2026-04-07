<script lang="ts">
    import SunIcon from "@lucide/svelte/icons/sun"
    import MoonIcon from "@lucide/svelte/icons/moon"
    import CopyIcon from "@lucide/svelte/icons/copy"
    import CheckIcon from "@lucide/svelte/icons/check"
    import teamsData from "$lib/data/teams.json"
    import { projects } from "$lib/data/projects"
    import Highlight from "svelte-highlight"
    import lua from "svelte-highlight/languages/lua"
    import vs from "svelte-highlight/styles/vs"
    import vs2015 from "svelte-highlight/styles/vs2015"

    let darkMode = $state(true)
    let copiedDiscordUsername = $state(false)
    let copiedScript = $state(false)

    async function copyDiscord() {
        await navigator.clipboard.writeText("umb.rph")
        copiedDiscordUsername = true
        setTimeout(() => (copiedDiscordUsername = false), 2000)
    }

    async function copyScript(content: string) {
        await navigator.clipboard.writeText(content)
        copiedScript = true
        setTimeout(() => (copiedScript = false), 2000)
    }

    type Project = {
        id: number,
        title: string,
        description: string,
        scripts: [ { name: string, content: string } ]
    }

    let selectedProject: Project | null = $state(null)

    projects.forEach(element => {
        // format line spacing
        element.scripts.forEach(script => {
            script.content = script.content.replace("/\t/g", "    ")
        })
    })

    function openProject(project: Project) {
        selectedProject = project
        document.body.style.overflow = "hidden"
    }

    function closeProject() {
        selectedProject = null
        document.body.style.overflow = ""
    }

    function handleKeydown(e: any) {
        if (e.key === "Escape" && selectedProject) closeProject()
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
  {#if darkMode}
    {@html vs2015}
  {:else}
    {@html vs}
  {/if}
</svelte:head>

<main class:darkMode>
    <button id="toggle-theme-btn" onclick={() => (darkMode = !darkMode)}>
        {#if darkMode}
            <SunIcon color="var(--text-color)" />
        {:else}
            <MoonIcon color="var(--text-color)" />
        {/if}
    </button>

    <div id="hero">
        <h1>Hi! I'm <span id="name">Umbrix</span></h1>
        <p id="bio">
            Self-taught developer from Germany, 16. Writing code since 12.
            Started with HTML, got into Luau about three and a half years ago.
            I build game systems, frameworks, and Studio plugins.
            I'm constantly learning and trying to improve myself. 
        </p>
    </div>

    <section class="teams">
        <h2 class="section-label">Teams</h2>

        <div class="grid">
            {#each teamsData as teamData}
                <a class="card" href={teamData.href} target="_blank" rel="noopener">
                    <div class="img-wrap">
                        <img src={teamData.img} alt="">
                    </div>
                    <div class="card-bottom">
                        <span class="card-title">{teamData.name}</span>
                    </div>
                </a>
            {/each}
        </div>
    </section>

    <section class="work">
        <h2 class="section-label">Work</h2>

        <div class="grid">
            {#each projects as p}
            <button class="project-card" onclick={() => openProject(p)}>
                <div class="project-card-top">
                <span class="project-card-title">{p.title}</span>
                <svg class="arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
                </div>
            </button>
            {/each}
        </div>
    </section>

    <footer>
        <button class="footer-link" onclick={copyDiscord} title="Copy Discord username">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.035.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            {copiedDiscordUsername ? "copied!" : "discord"}
        </button>

        <a class="footer-link" href="https://github.com/umbrix-dev" target="_blank" rel="noopener">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            github
        </a>

        <a class="footer-link" href="https://www.roblox.com/users/3429170575/profile" target="_blank" rel="noopener">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <g transform="rotate(15 12 12)">
                    <rect x="4" y="4" width="16" height="16"/>
                    <rect x="9" y="9" width="6" height="6" fill="var(--bg-color)"/>
                </g>
            </svg>
            roblox
        </a>

        <a class="footer-link" href="https://scriptdotparent.github.io/portfolio/" target="_blank" rel="noopener">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10.59 13.41a1.996 1.996 0 0 1 0-2.82l3.18-3.18a2 2 0 1 1 2.83 2.83l-1.41 1.41 1.41 1.41 1.41-1.41a4 4 0 0 0-5.66-5.66l-3.18 3.18a4 4 0 0 0 0 5.66l.71.71 1.41-1.41-.7-.72zm2.82-2.82a1.996 1.996 0 0 1 0 2.82l-3.18 3.18a2 2 0 1 1-2.83-2.83l1.41-1.41-1.41-1.41-1.41 1.41a4 4 0 1 0 5.66 5.66l3.18-3.18a4 4 0 0 0 0-5.66l-.71-.71-1.41 1.41.7.72z"/>
            </svg>
            credit
        </a>
    </footer>

    {#if selectedProject}
    <div class="backdrop" onclick={closeProject}></div>
    <div class="overlay" role="dialog" aria-modal="true">
        <div class="overlay-inner">
                <div class="code-pane">
                    <div class="code-scroll">
                        {#each selectedProject.scripts as script}
                            <div class="code-block">
                                <div class="code-header">
                                    <span class="code-filename">{script.name}</span>
                                </div>

                                <button class="copy-script-btn" onclick={() => copyScript(script.content)} title="Copy script">
                                    {#if copiedScript}
                                        <CheckIcon size="18" />
                                    {:else}
                                        <CopyIcon size="18" />
                                    {/if}
                                </button>

                                <div class="code-content-wrapper">
                                    <Highlight language={lua} code={script.content.replace(/\t/g, "    ")} />
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="info-pane">
                    <button class="close-btn" onclick={closeProject} aria-label="Close">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                    <div class="info-content">
                        <h3 class="info-title">{selectedProject.title}</h3>
                        <p class="info-desc">{selectedProject.description}</p>
                    </div>
                </div>
            </div>
    </div>
{/if}
</main>

<style>
    @import url(https://fonts.googleapis.com/css?family=Nunito:200,300,regular,500,600,700,800,900,200italic,300italic,italic,500italic,600italic,700italic,800italic,900italic);
    @import url(https://fonts.googleapis.com/css?family=DM+Sans:100,200,300,regular,500,600,700,800,900,100italic,200italic,300italic,italic,500italic,600italic,700italic,800italic,900italic);
    @import url(https://fonts.googleapis.com/css?family=JetBrains+Mono:100,200,300,regular,500,600,700,800,100italic,200italic,300italic,italic,500italic,600italic,700italic,800italic);

    :global(body) {
        margin: 0;
        overflow-x: hidden;
    }

    main {
        --bg-color: #f4f1ec;
        --bg2-color:  #edeae4;
        --overlay-bg: rgba(26, 24, 20, 0.55);
        --border: #ccc8c0;
        --text-color: #1a1814;
        --text-muted-color: #6b6560;
        --font-primary: "Nunito", sans-serif;
        --font-secondary: "DM Sans", sans-serif;
        --font-mono: "JetBrains Mono", monospace;
    }

    main.darkMode {
        --bg-color: #111010;
        --bg2-color: #1a1917;
        --overlay-bg: rgba(0, 0, 0, 0.7);
        --border:  #2b2926;
        --text-color: #e8e4dc;
        --text-muted-color: #78746e;
    }

    main {
        background-color: var(--bg-color);
        color: var(--text-color);
        font-family: var(--font-secondary);

        /* position: fixed; */
        padding: 10px;
        top: 0;
        left: 0;
        width: 100svw;
        min-height: 100svh;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        transition: background-color 0.25s, color 0.25s;
    }

    #toggle-theme-btn {
        background: none;
        border: none;

        position: fixed;
        top: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
    }

    #toggle-theme-btn:hover {
        cursor: pointer;
    }

    h1 {
        font-family: var(--font-primary);
        font-size: 4.5rem;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.025em;
        margin-top: 100px;
    }

    #name {
        font-style: italic;
        position: relative;
    }

    #name::after {
        content: '';
        position: absolute;
        left: 0; bottom: 8px;
        width: 100%; height: 2px;
        background: var(--text-color);
        opacity: 0.18;
    }

    #bio {
        color: var(--text-muted-color);
        font-size: 1.2rem;
        line-height: 1.78;
        max-width: 650px;
    }

    section {
        margin-top: 30px;
    }

    .section-label {
        color: var(--text-muted-color);
        font-family: var(--font-mono);
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.05em;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
        width: 100%;
        max-width: 650px;
    }

    .card {
        color: var(--text-color);
        font-family: var(--font-primary);
        cursor: pointer;

        font-weight: 700;
        background: none;
        border: none;
        text-decoration: none;
        margin: 0;
        padding: 0;
        width: 100%;
        transition: scale 0.15s;
    }

    .card:hover {
        scale: 1.025;
    }

    .card img {
        border-top-left-radius: 16px;
        border-top-right-radius: 16px;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .card-bottom {
        margin-top: -5px;
        border-bottom-left-radius: 16px;
        border-bottom-right-radius: 16px;
        background-color: var(--bg2-color);
        height: 50px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
    }

    .project-card {
        cursor: pointer;
        font-family: var(--font-primary);
        font-weight: 700;
        color: var(--text-color);
        text-align: left;
        padding: 14px 16px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--bg2-color);
        transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
    }

    .project-card:hover {
        border-color: var(--text-color);
        transform: translateY(-1px);
    }

    .darkMode .project-card:hover {
        box-shadow: 0 4px 18px rgba(0, 0, 0, 0.32);
    }

    .project-card-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .arrow {
        opacity: 0.28;
        flex-shrink: 0;
        transition: opacity 0.15s, transform 0.15s;
    }

    .project-card:hover .arrow {
        opacity: 0.7;
        transform: translate(2px, -2px);
    }

    footer {
        margin-top: 40px;
        padding-top: 22px;
        border-top: 1px solid var(--border);
        width: 650px;

        display: flex;
        align-items: center;
        justify-content: center;
        gap: 28px;
        margin-bottom: 50px;
    }

    .footer-link {
        color: var(--text-muted-color);
        font-family: var(--font-mono);
        font-size: 11px;
        letter-spacing: 0.06em;
        text-decoration: none;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;

        display: flex;
        align-items: center;
        gap: 7px;
    }

    .footer-link:hover {
        color: var(--text-color);
    }

    .backdrop {
        position: fixed;
        inset: 0;
        background: var(--overlay-bg);
        backdrop-filter: blur(7px);
        -webkit-backdrop-filter: blur(7px);
        z-index: 200;
        animation: fadeIn 0.18s ease;
    }

    .overlay {
        position: fixed;
        inset: 0;
        z-index: 201;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .overlay-inner {
        border-radius: 6px;
        width: 100%;
        max-width: 880px;
        height: min(80vh, 580px);
        background: var(--bg-color);
        border: 1px solid var(--border);
        border-radius: 18px;
        display: flex;
        overflow: hidden;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.16);
    }
  
    .darkMode .overlay-inner {
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
    }

    .code-pane {
        flex: 1.3;
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--border);
        min-width: 0;
    }

    .code-header {
        font-family: var(--font-primary);
        color: var(--text-color);
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 11.5px 14px;
        background: var(--bg2-color);
        border-bottom: 1px solid var(--border);
        border-radius: 6px;
        width: 87%;
    }

    .code-block {
        padding: 10px;
        position: relative;
    }

    .copy-script-btn {
        cursor: pointer;
        color: var(--text-color);
        background: var(--bg2-color);
        padding: 10px;
        border: none;
        border-radius: 6px;
        position: absolute;
        top: 10px;
        right: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .code-filename {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--text-muted-color);
        letter-spacing: 0.05em;
    }

    .code-scroll {
        flex: 1;
        overflow-y: auto;
        background: var(--code-bg);
        scrollbar-width: thin;
        scrollbar-color: var(--border) transparent;
    }

    .info-pane {
        width: 260px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        position: relative;
    }

    .close-btn {
        position: absolute;
        cursor: pointer;
        top: 14px; right: 14px;
        width: 28px; height: 28px;
        border-radius: 50%;
        border: 1px solid var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--muted);
        background: var(--bg-color);
        transition: color 0.15s, border-color 0.15s;
        z-index: 1;
    }
    .close-btn:hover { color: var(--text-color); border-color: var(--text-color); }

    .info-content {
        padding: 24px 20px;
        display: flex;
        flex-direction: column;
        /* gap: 12px; */
        overflow-y: auto;
        flex: 1;
    }

    .info-title {
        font-family: 'Nunito', sans-serif;
        font-size: 1.2rem;
        font-weight: 800;
        letter-spacing: -0.015em;
        line-height: 1.2;
        /* padding-top: 22px; */
    }

    .info-desc {
        font-size: 0.875rem;
        line-height: 1.72;
        color: var(--muted);
    }

    :global(pre) {
        margin: 0;
    }

    .code-content-wrapper {
        margin-top: 10px;
        border-radius: 6px;
        overflow: hidden;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideUp {
        from { opacity: 0; transform: translateY(14px) scale(0.98); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @media (max-width: 600px) {
        main { padding: 72px 20px 56px; }

        .overlay-inner {
            flex-direction: column;
            height: 88vh;
            border-radius: 14px;
        }

        .code-pane {
            flex: 1;
            border-right: none;
            border-bottom: 1px solid var(--border);
        }

        .info-pane { width: 100%; }
        .info-content { padding: 16px; }
  }
</style>