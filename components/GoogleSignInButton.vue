<template>
  <div ref="googleSignInButton"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRuntimeConfig } from '#app';

// Define as propriedades que o componente pode receber
interface Props {
  onSuccess: (userData: any) => void;
  onError: (error: string) => void;
}

const props = defineProps<Props>();

const router = useRouter();
const config = useRuntimeConfig();
const googleSignInButton = ref<HTMLElement | null>(null);
const apiUrl = config.public.apiUrl;

// Assinatura da interface para o objeto retornado pelo Google
interface GoogleCredentialResponse {
  credential: string;
}

// Função que será chamada quando o Google retornar o token
const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
  console.log('Token do Google recebido:', response.credential);

  try {

    // Envia o token para o backend para autenticação
    console.log('Enviando token para o backend: ' + `${apiUrl}/api/google-sign-in/`);
    const backendResponse = await fetch(`${apiUrl}/api/google-sign-in/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: response.credential }),
    });

    console.log('Resposta do backend recebida:', backendResponse);

    const data = await backendResponse.json();

    if (backendResponse.ok) {
      console.log('Login bem-sucedido no backend:', data.user_data);
      props.onSuccess(data.user_data);
      // Exemplo: Redirecionar para uma página após o login
      // router.push('/dashboard');
    } else {
      console.error('Erro no login do backend:', data.error);
      props.onError(data.error || 'Erro desconhecido no backend.');
    }
  } catch (error) {
    console.error('Erro ao enviar token para o backend:', error);
    props.onError('Erro de conexão ou ao processar o login.');
  }
};

onMounted(() => {
  // Verifica se o objeto 'google' está disponível globalmente
  if (window && (window as any).google) {
    (window as any).google.accounts.id.initialize({
      client_id: config.public.googleClientId, // Substitua pelo seu Client ID do Google
      callback: handleCredentialResponse,
    });

    // Renderiza o botão de login do Google dentro do elemento ref
    if (googleSignInButton.value) {
      (window as any).google.accounts.id.renderButton(
        googleSignInButton.value,
        { theme: 'outline', size: 'large', text: 'signin_with', width: '400' } // Personalize o estilo do botão
      );
    }
  } else {
    console.error('Google Identity Services script not loaded.');
  }
});
</script>

<style scoped>
/* Estilos específicos para o botão de login do Google */

.google-sign-in-button {
  display: inline-block;
  border-radius: 5px;
  padding: 5px;
}

.google-sign-in-button:hover {
  background-color: #515E54;
  opacity: 0.5;
}
</style>