<template>
  <div class="not-found">
    <h1>404</h1>
    <p>ページが見つかりませんでした</p>
    <router-link to="/" class="btn btn-primary">ホームに戻る</router-link>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 4rem 0;
}

h1 {
  font-size: 6rem;
  color: rgb(var(--color-primary));
  margin-bottom: 1rem;
}

p {
  font-size: 1.5rem;
  color: rgb(var(--color-secondary));
  margin-bottom: 2rem;
}

</style> 