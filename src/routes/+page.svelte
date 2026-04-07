<script lang="ts">
    import SunIcon from "@lucide/svelte/icons/sun"
    import MoonIcon from "@lucide/svelte/icons/moon"
    import LinkIcon from "@lucide/svelte/icons/link"

    let darkMode = $state(true)
    let copiedDiscordUsername = $state(false)

    async function copyDiscord() {
        await navigator.clipboard.writeText("umb.rph");
        copiedDiscordUsername = true;
        setTimeout(() => (copiedDiscordUsername = false), 2000);
    }
</script>

<main class:darkMode>
    <button id="toggle-theme-btn" onclick={() => (darkMode = !darkMode)}>
        {#if darkMode}
            <SunIcon color="var(--text-color)" />
        {:else}
            <MoonIcon color="var(--text-color)" />
        {/if}
    </button>

    <div class="hero">
        <h1>Hi! I'm <span class="name">Umbrix</span></h1>
        <p class="bio">
            Self-taught developer from Germany, 16. Writing code since 12.
            Started with HTML, got into Luau about three and a half years ago.
            I build game systems, frameworks, and Studio plugins.
            I'm constantly learning and trying to improve myself. 
        </p>
    </div>

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
</main>

<style>
    @import url(https://fonts.googleapis.com/css?family=Nunito:200,300,regular,500,600,700,800,900,200italic,300italic,italic,500italic,600italic,700italic,800italic,900italic);
    @import url(https://fonts.googleapis.com/css?family=DM+Sans:100,200,300,regular,500,600,700,800,900,100italic,200italic,300italic,italic,500italic,600italic,700italic,800italic,900italic);

    main {
        --bg-color: white;
        --text-color: black;
        --font-primary: "Nunito";
        --font-secondary: "DM Sans";
    }

    main.darkMode {
        --bg-color: black;
        --text-color: white;
    }

    main {
        background-color: var(--bg-color);
        color: var(--text-color);
        font-family: var(--font-secondary);

        position: fixed;
        top: 0;
        left: 0;
        width: 100svw;
        height: 100svh;

        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
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
        font-size: 2.5rem;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.025em;
    }

    .name {
        font-style: italic;
        position: relative;
    }

    .name::after {
        content: '';
        position: absolute;
        left: 0; bottom: 3px;
        width: 100%; height: 2px;
        background: var(--text-color);
        opacity: 0.18;
    }

    .bio {
        line-height: 1.78;
        max-width: 540px;
    }
</style>