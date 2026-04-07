<script lang="ts">
    import SunIcon from "@lucide/svelte/icons/sun";
    import MoonIcon from "@lucide/svelte/icons/moon";

    let darkMode = $state(true);
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

    .bio {
        line-height: 1.78;
        max-width: 540px;
    }
</style>