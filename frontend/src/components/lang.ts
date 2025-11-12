function t() {
    const supportedLanguages = ["en", "fi", "fr", "ru"] as const;
    let locale = document.documentElement.lang;
    if (!supportedLanguages.includes(locale as any)) {
        locale = "en";
    }
    return table[locale as keyof typeof table];
}

const table = Object.freeze(
    {
        "en": {
            alreadyRegistered: "Already registered? Login!",
            back: "Back",
            couldNotConnectToServer: "Could not connect to the server",
            createNewUser: "Create new user",
            email: "Email",
            intro: "Let's get ready to play!",
            logIn: "Log In",
            logOut: "Log Out",
            notRegisteredYet: "Not registered yet? Sign up!",
            password: "Password",
            signUp: "Sign Up",
            username: "Username",
            wantToLogOut: "Want to log out?"
        },
        "fr": {
            alreadyRegistered: "Déjà inscrit ? Connectez-vous !",
            back: "Retour",
            couldNotConnectToServer: "Impossible de se connecter au serveur",
            createNewUser: "Créer un nouvel utilisateur",
            email: "Email",
            intro: "Préparez-vous à jouer !",
            logIn: "Connexion",
            logOut: "Se déconnecter",
            notRegisteredYet: "Pas encore inscrit ? Inscrivez-vous !",
            password: "Mot de passe",
            signUp: "S'inscrire",
            username: "Nom d'utilisateur",
            wantToLogOut: "Voulez-vous vous déconnecter ?"
        },
        "fi": {
            alreadyRegistered: "Oletko jo rekisteröitynyt? Kirjaudu sisään!",
            back: "Takaisin",
            couldNotConnectToServer: "Yhteyttä palvelimeen ei voitu muodostaa",
            createNewUser: "Luo uusi käyttäjä",
            email: "Sähköposti",
            intro: "Valmistaudutaan pelaamaan!",
            logIn: "Kirjaudu sisään",
            logOut: "Kirjaudu ulos",
            notRegisteredYet: "Etkö ole vielä rekisteröitynyt? Rekisteröidy!",
            password: "Salasana",
            signUp: "Rekisteröidy",
            username: "Käyttäjänimi",
            wantToLogOut: "Haluatko kirjautua ulos?"
        },
        "ru": {
            alreadyRegistered: "Уже зарегистрированы? Войдите!",
            back: "Назад",
            couldNotConnectToServer: "Не удалось подключиться к серверу",
            createNewUser: "Создать нового пользователя",
            email: "Электронная почта",
            intro: "Давайте приготовимся к игре!",
            logIn: "Вход",
            logOut: "Выйти",
            notRegisteredYet: "Ещё не зарегистрированы? Зарегистрируйтесь!",
            password: "Пароль",
            signUp: "Регистрация",
            username: "Имя пользователя",
            wantToLogOut: "Хотите выйти?"
        }
    }
);

export {t};
