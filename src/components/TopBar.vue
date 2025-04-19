<template>
  <header>
    <div class="logo">
      <span class="logo-sub">MPM</span>
      <span class="logo-main">WCU</span>
    </div>
    <div class="user-info">
      <span v-if="signedInUsername">Signed in as: {{ signedInUsername }}</span>
      <button v-if="signedInUsername" class="auth-btn" @click="handleSignOut">Sign Out</button>
      <template v-else>
        <button class="auth-btn" @click="$emit('open-sign-in')">Login</button>
        <button class="auth-btn" @click="$emit('open-sign-up')">Register</button>
      </template>
    </div>
  </header>
</template>

<script>
import { signOut, fetchAuthSession } from 'aws-amplify/auth';

export default {
  name: 'TopBar',
  props: {
    signedInUsername: {
      type: String,
      default: null,
    },
  },
  methods: {
    async handleSignOut() {
      try {
        await signOut();
        const session = await fetchAuthSession();
        console.log('Sign-out successful, session:', session);
        this.$emit('update-signed-in-username', null);
      } catch (error) {
        console.error('Sign-out error:', error);
      }
    },
  },
};
</script>

<style scoped>
header {
  background-color: #181619;
  width: calc(100% - 25px);
  max-width: 100%;
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-shadow: none;
}

.logo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.logo-sub {
  font-size: 0.8em;
  color: var(--text-primary);
  line-height: 1;
}

.logo-main {
  font-size: 1.5em;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-info span {
  color: var(--text-primary);
  font-size: 1em;
}

.auth-btn {
  padding: 8px 16px; /* Override padding for smaller buttons */
}
</style>