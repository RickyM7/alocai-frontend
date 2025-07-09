<template>
  <div class="login-container">
    <div class="login-card">
      <div class="logo-section">
        <!-- <img src="/img/logo-ufrpe.png" alt="Logo UFRPE" class="logo" /> -->
        <h1 class="welcome-text">Bem Vindo</h1>
        <h2 class="app-title">Agendamento de Recursos Compartilhados</h2>
      </div>

      <!-- Botão Google Sign-In -->
      <GoogleSignInButton
        :client-id="googleClientId"
        @success="handleLoginSuccess"
        @error="handleLoginError"
      />

      <!-- Mensagem de sucesso -->
      <div v-if="message" class="success-message">
        {{ message }}
      </div>

      <!-- Mensagem de erro -->
      <div v-if="erro" class="error-message">
        {{ erro }}
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import GoogleSignInButton from '~/components/GoogleSignInButton.vue'; // Ajuste o caminho se necessário

const message = ref<string | null>(null);
const erro = ref<string | null>(null);

/**
 * @description Função chamada quando o login com Google é bem-sucedido.
 */
const handleLoginSuccess = (userData: any) => {
  message.value = `Login bem-sucedido! Bem-vindo, ${userData.name}!`;
  // Você pode armazenar os dados do usuário no Vuex/Pinia, ou em LocalStorage
  // Exemplo: localStorage.setItem('user', JSON.stringify(userData));
  console.log('Dados do usuário:', userData);
  // Redirecionar para a página principal ou dashboard
  // useRouter().push('/dashboard');
};

/**
 * @description Função chamada quando ocorre erro no login com Google.
 */
const handleLoginError = (error: string) => {
  erro.value = `Erro no login: ${error}`;
  console.error('Erro na autenticação:', error);
};

const config = useRuntimeConfig()
// Google Client ID - substitua pelo seu Client ID real
const googleClientId = config.public.googleClientId

// Configuração da página
definePageMeta({
  layout: false // Desabilita o layout padrão para a página de login
})

</script>

<style scoped>
/* Variáveis CSS para cores e fontes, para facilitar a manutenção */
:root {
  --primary-color: #4CAF50; /* Um verde semelhante ao do botão */
  --text-color: #333;
  --light-text-color: #666;
  --border-color: #ddd;
  --background-color: #f0f2f5;
  --card-background: #fff;
  --link-color: #007bff;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--background-color);
  font-family: 'Arial', sans-serif; /* Considere usar uma fonte mais adequada, se houver */
}

.login-card {
  background-color: var(--card-background);
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 100%;
  max-width: 400px; /* Largura máxima para o cartão de login */
  box-sizing: border-box; /* Garante que padding não adicione largura extra */
}

.logo-section {
  margin-bottom: 30px;
}

.logo {
  max-width: 80px; /* Ajuste o tamanho do logo conforme a imagem */
  height: auto;
  margin-bottom: 10px;
}

.welcome-text {
  font-size: 1.2em;
  color: var(--light-text-color);
  margin-bottom: 5px;
}

.app-title {
  font-size: 1.5em;
  color: var(--text-color);
  font-weight: bold;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px; /* Espaço entre os grupos de formulário */
}

.form-group {
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: var(--text-color);
  font-size: 0.9em;
}

.form-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid var(--border-color);
  border-radius: 5px;
  font-size: 1em;
  box-sizing: border-box; /* Importante para o padding não expandir o input */
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2); /* Sombra suave ao focar */
}

/* Estilo específico para o grupo da senha */
.password-group {
  position: relative; /* Para posicionar o ícone do olho */
}

.password-input-wrapper {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--light-text-color);
  font-size: 1.2em; /* Tamanho do ícone/texto */
}

.forgot-password-link {
  display: block;
  text-align: right;
  margin-top: 10px;
  color: var(--link-color);
  text-decoration: none;
  font-size: 0.9em;
}

.forgot-password-link:hover,
.create-account-link:hover {
  text-decoration: underline;
}

.login-button {
  background-color: #3d5e40; /* Cor mais escura do botão na imagem */
  color: white;
  padding: 14px 20px;
  border: none;
  border-radius: 5px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: 100%; /* Botão ocupa a largura total */
  margin-top: 20px;
}

.login-button:hover {
  background-color: #2e4a30; /* Um pouco mais escuro no hover */
}

.login-button:disabled {
  background-color: #6b7c6f;
  cursor: not-allowed;
}

/* Divisor */
.divider {
  display: flex;
  align-items: center;
  margin: 30px 0;
  color: var(--light-text-color);
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background-color: var(--border-color);
}

.divider span {
  padding: 0 15px;
  font-size: 0.9em;
  color: var(--light-text-color);
}

/* Mensagem de erro */
.error-message {
  background-color: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
  padding: 12px;
  border-radius: 5px;
  margin: 20px 0;
  font-size: 0.9em;
  text-align: center;
}

.success-message {
  background-color: #e8f5e9;
  border: 1px solid #4caf50;
  color: #2e7d32;
  padding: 12px;
  border-radius: 5px;
  margin: 20px 0;
  font-size: 0.9em;
  text-align: center;
}

.signup-section {
  margin-top: 30px;
  font-size: 0.9em;
  color: var(--light-text-color);
}

.create-account-link {
  color: var(--link-color);
  text-decoration: none;
  font-weight: bold;
}

/* Responsividade básica (opcional, mas bom ter) */
@media (max-width: 600px) {
  .login-card {
    margin: 20px; /* Adiciona um pouco de margem em telas menores */
    padding: 30px 20px;
  }
  .app-title {
    font-size: 1.3em;
  }
  .login-button {
    padding: 12px 15px;
    font-size: 1em;
  }
}
</style>