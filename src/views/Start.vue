<template>
  <div class="start">
    <h1>Wishlist</h1>
    <section>
      <h2>Neue Liste anlegen</h2>
      <div>
        <input type="text" v-model="title" placeholder="title" />
        <input type="text" v-model="description" placeholder="description" />
        <button @click="addList()">Liste hinzufügen</button>
      </div>
    </section>
    <section>
      <h2>Zuletzt erstellt</h2>
      <p>Dieser Bereich ist nur auf diesem Gerät sichtbar.</p>
      <p>TODO</p>
    </section>
  </div>
</template>

<script>
export default {
  name: 'App',
  data: () => ({
    title: '',
    description: '',
  }),
  methods: {
    // store new item
    async addList () {
      const slugPublic = this.generateSlug(10)
      const slugPrivate = this.generateSlug(16)
      await this.$supabase.from('lists').insert({
        'title': this.title,
        'description': this.description,
        'slug_public': slugPublic,
        'slug_private': slugPrivate,
      })
      this.$router.push('/' + slugPublic + '/' + slugPrivate)
    },
    // get random slug string
    generateSlug (length) {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      let result = ''
      for (let i = length; i>0; --i) result += chars[Math.round(Math.random()*(chars.length-1))]
      return result
    }
  }
}
</script>

<style lang="stylus">
</style>
