export default {
    template: `
        <main class="public-profile-page">
            <h1>Public Profile</h1>

            <p>
                User: {{ $route.params.username }}
            </p>
        </main>
    `
};