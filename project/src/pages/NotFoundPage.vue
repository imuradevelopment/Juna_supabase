<template>
  <div class="not-found">
    <h1>404</h1>
    <p>ページが見つかりませんでした</p>
    <router-link to="/" class="btn">ホームに戻る</router-link>
  </div>
</template>

<style scoped>
.not-found {
  text-align: center;
  padding: 4rem 0;
}

h1 {
  font-size: 6rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

p {
  font-size: 1.5rem;
  color: var(--secondary-color);
  margin-bottom: 2rem;
}

.btn {
  display: inline-block;
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  text-decoration: none;
}

.btn:hover {
  background-color: var(--primary-hover);
  text-decoration: none;
}
</style> 