<template>
  <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
      <div class="sign-in-dialog">
      <div class="dialog-header">
          <div class="dialog-logo">
          <span class="logo-sub">MPM</span>
          <span class="logo-main">WCU</span>
          <h2>{{ title }}</h2>
          </div>
      </div>
      <slot name="form-content"></slot>
      </div>
  </div>
</template>

<script>
export default {
  name: 'AuthDialog',
  props: {
      show: {
        type: Boolean,
        default: false,
      },
        title: {
        type: String,
        required: true,
      },
  },
  methods: {
      handleOverlayClick(event) {
      if (event.target.classList.contains('dialog-overlay')) {
        this.$emit('close');
      }
      },
  },
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.sign-in-dialog {
  background-color: var(--background-form);
  padding: 60px 20px;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
  width: 780px;
  max-width: 90%;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.dialog-header {
  margin-bottom: 20px;
}

.dialog-header .dialog-logo {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.dialog-header .logo-sub {
  font-size: 0.96em;
  color: var(--text-primary);
  line-height: 1;
}

.dialog-header .logo-main {
  font-size: 2.4em;
  font-weight: bold;
  color: var(--text-primary);
  line-height: 1;
}

.dialog-header h2 {
  margin: 10px 0 0 0;
  font-weight: normal;
}
</style>