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
            chooseSize: "Choose size",
            couldNotConnectToServer: "Could not connect to the server",
            createNewUser: "Create new user",
            email: "Email",
            fourPlayers: "4 players",
            howDoYouWantToPlay: "How do you want to play?",
            intro: "Let's get ready to play!",
            logIn: "Log In",
            logOut: "Log Out",
            loginOrSignupPlayer: "Login or Signup Player",
            next: "Next",
            notRegisteredYet: "Not registered yet? Sign up!",
            oneVsOne: "1 vs 1",
            password: "Password",
            signUp: "Sign Up",
            tournament: "Tournament",
            tournamentSize: "Tournament size",
            username: "Username",
            wantToLogOut: "Want to log out?"
        },
        "fr": {
            alreadyRegistered: "Déjà inscrit ? Connectez-vous !",
            back: "Retour",
            chooseSize: "Choisir la taille",
            couldNotConnectToServer: "Impossible de se connecter au serveur",
            createNewUser: "Créer un nouvel utilisateur",
            email: "Email",
            fourPlayers: "4 joueurs",
            howDoYouWantToPlay: "Comment voulez-vous jouer ?",
            intro: "Préparez-vous à jouer !",
            logIn: "Connexion",
            logOut: "Se déconnecter",
            loginOrSignupPlayer: "Connexion ou Inscription Joueur",
            next: "Suivant",
            notRegisteredYet: "Pas encore inscrit ? Inscrivez-vous !",
            oneVsOne: "1 contre 1",
            password: "Mot de passe",
            signUp: "S'inscrire",
            tournament: "Tournoi",
            tournamentSize: "Taille du tournoi",
            username: "Nom d'utilisateur",
            wantToLogOut: "Voulez-vous vous déconnecter ?"
        },
        "fi": {
            alreadyRegistered: "Oletko jo rekisteröitynyt? Kirjaudu sisään!",
            back: "Takaisin",
            chooseSize: "Valitse koko",
            couldNotConnectToServer: "Yhteyttä palvelimeen ei voitu muodostaa",
            createNewUser: "Luo uusi käyttäjä",
            email: "Sähköposti",
            fourPlayers: "4 pelaajaa",
            howDoYouWantToPlay: "Miten haluat pelata?",
            intro: "Valmistaudutaan pelaamaan!",
            logIn: "Kirjaudu sisään",
            logOut: "Kirjaudu ulos",
            loginOrSignupPlayer: "Kirjaudu tai rekisteröidy pelaaja",
            next: "Seuraava",
            notRegisteredYet: "Etkö ole vielä rekisteröitynyt? Rekisteröidy!",
            oneVsOne: "1 vastaan 1",
            password: "Salasana",
            signUp: "Rekisteröidy",
            tournament: "Turnaus",
            tournamentSize: "Turnauksen koko",
            username: "Käyttäjänimi",
            wantToLogOut: "Haluatko kirjautua ulos?"
        },
        "ru": {
            alreadyRegistered: "Уже зарегистрированы? Войдите!",
            back: "Назад",
            chooseSize: "Выберите размер",
            couldNotConnectToServer: "Не удалось подключиться к серверу",
            createNewUser: "Создать нового пользователя",
            email: "Электронная почта",
            fourPlayers: "4 игрока",
            howDoYouWantToPlay: "Как вы хотите играть?",
            intro: "Давайте приготовимся к игре!",
            logIn: "Вход",
            logOut: "Выйти",
            loginOrSignupPlayer: "Войти или зарегистрировать игрока",
            next: "Далее",
            notRegisteredYet: "Ещё не зарегистрированы? Зарегистрируйтесь!",
            oneVsOne: "1 против 1",
            password: "Пароль",
            signUp: "Регистрация",
            tournament: "Турнир",
            tournamentSize: "Размер турнира",
            username: "Имя пользователя",
            wantToLogOut: "Хотите выйти?"
        }
    }
);

export {t};
