<template>
  <div ref="googleSignInButton"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRuntimeConfig } from '#app';
import type { User } from '~/types/user';

interface Props {
  onSuccess: (response: any) => void;
  onError: (error: string) => void;
}

const props = defineProps<Props>();

const config = useRuntimeConfig();
const googleSignInButton = ref<HTMLElement | null>(null);
const apiUrl = config.public.apiUrl;

interface GoogleCredentialResponse {
  credential: string;
}

interface UserResult {
  access: string;
  user_data: User;
}

const handleCredentialResponse = async (response: GoogleCredentialResponse) => {
  if (window.location.pathname.includes('/login')) {
    try {
      const backendResponse = await fetch(`${apiUrl}/api/google-sign-in/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (backendResponse.ok) {
        const data: UserResult = await backendResponse.json();
        if (data.access) {
          localStorage.setItem('access', data.access);
        }
        props.onSuccess(data.user_data);
      } else {
        const errorData: { error: string } = await backendResponse.json();
        props.onError(errorData.error || 'Erro desconhecido no backend.');
      }
    } catch (error) {
      props.onError('Erro de conexão ou ao processar o login.');
    }
  } else {
    props.onSuccess(response);
  }
};

onMounted(() => {
  if (window && (window as any).google) {
    (window as any).google.accounts.id.initialize({
      client_id: config.public.googleClientId,
      callback: handleCredentialResponse,
    });
    if (googleSignInButton.value) {
      (window as any).google.accounts.id.renderButton(
        googleSignInButton.value,
        { theme: 'outline', size: 'large', text: 'signin_with' }
      );
    }
  } else {
    console.error('Google Identity Services script not loaded.');
  }
});
</script>