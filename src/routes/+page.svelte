<script lang="ts">
    let darkMode = $state(true);
</script>

<main class:darkMode>
    <button id="toggle-theme-btn" onclick={() => (darkMode = !darkMode)}>
        toggle
    </button>
</main>

<style>
    main {
        --bg-color: white;
    }

    main.darkMode {
        --bg-color: black
    }

    main {
        background-color: var(--bg-color);

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
</style>