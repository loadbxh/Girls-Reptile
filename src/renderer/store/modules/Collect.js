const state = {
    running: false,
    timeout: 10
}

const mutations = {
    STOP (state) {
      state.running = false
    },
    RUN (state) {
      state.running = true
    },
    TIMEOUT(state, param){
        state.timeout = param
    }
}

const actions = {
    
  }

export default {
    state,
    mutations,
    actions
  }