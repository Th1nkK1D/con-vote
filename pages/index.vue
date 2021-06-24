<template>
  <div class="container">
    <Header>
      <LiveBadge :config="config"></LiveBadge>
    </Header>

    <h1 class="title-header">
      <span v-if="config.test">(Test)</span>{{ config.title }}
    </h1>

    <div class="filter-box-wrap">
      <el-select v-model="value" placeholder="Select">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="`${item.label} (${item.total})`"
          :value="item.value"
        >
        </el-option>
      </el-select>

      <div class="legend-wrap">
        <div class="legend">
          <div class="circle"></div>
          <p class="text">รับ</p>
        </div>
        <div class="legend">
          <div class="circle"></div>
          <p class="text">ไม่รับ</p>
        </div>
        <div class="legend">
          <div class="circle"></div>
          <p class="text">งดออกเสียง</p>
        </div>
        <div class="legend">
          <div class="circle"></div>
          <p class="text">ขาดประชุม/ไม่ประสงค์ลงคะแนน</p>
        </div>
      </div>
    </div>

    <div v-dragscroll class="wrapper">
      <table id="vote-log-table">
        <th v-for="(h, index) in header" :key="index" class="header">
          <el-popover
            v-if="index !== 0"
            placement="bottom"
            :width="index == 7 ? 500 : 200"
            trigger="hover"
            class="detail-box"
            :disabled="!h.content"
          >
            <p v-if="h.content" v-html="h.content"></p>
            <div slot="reference">
              <div class="table-header-text" v-html="h.label"></div>
              <div
                class="chart-warp"
                :style="{
                  visibility:
                    (con_votes[index - 1] || {}).count === 0
                      ? 'hidden'
                      : 'visible',
                }"
              >
                <div
                  v-for="voteType in vote_types"
                  :key="voteType"
                  class="chart"
                  :style="{ width: calPercent(con_votes[index - 1], voteType) }"
                ></div>
              </div>
              <div class="legend-wrap">
                <div
                  v-for="voteType in vote_types"
                  :key="voteType"
                  class="legend"
                >
                  <div class="circle"></div>
                  <p class="text">
                    {{ (con_votes[index - 1] || {})[voteType] || 0 }}
                  </p>
                </div>
              </div>
            </div>
          </el-popover>
          <template v-else>
            <div class="table-header-text" v-html="h.label"></div>
          </template>
        </th>
        <tr v-for="d in table_data" :key="'section' + d.id">
          <td class="full-name">
            <a :href="d.url" target="_blank">{{ d.fullname }}</a>
          </td>
          <td v-for="stage in config.stages" :key="stage.key">
            <div class="circle-wrap">
              <div
                :class="{
                  circle: true,
                  'is-fresh': d[`${stage.key}_is_fresh`],
                }"
                :style="{ background: setColor(d[stage.key]) }"
              />
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import { DateTime, Interval } from 'luxon'
import LiveBadge from '@/components/LiveBadge'
import Header from '@/components/Header'

let configUpdateInterval
let dataUpdateInterval

function isFresh(person, key) {
  const keyUpdatedAt = `${key}_updated_at`
  if (!person[key] || !person[keyUpdatedAt]) return false
  const now = DateTime.local()
  const update = DateTime.fromISO(person[keyUpdatedAt])
  const interval = Interval.fromDateTimes(update, now)
  if (!interval.isValid) return false
  // Fresh if it just updated within 2 minutes
  return interval.length('minutes') < 2
}

export default {
  components: {
    Header,
    LiveBadge,
  },
  data() {
    return {
      config: {},
      // master data
      live_vote: [],
      // filtered data derived from "live_data"
      data: [],
      options: [],
      value: 'ทั้งหมด',
      content: '',
      con_votes: [],
      vote_types: ['1', '2', '3', '4'],
    }
  },
  computed: {
    header() {
      return [{ label: 'ชื่อ', key: 'name' }, ...this.config.stages]
    },
    default_options() {
      return [
        {
          value: 'ทั้งหมด',
          label: 'ทั้งหมด',
          total: this.live_vote.length,
        },
        {
          value: 'ส.ว.',
          label: 'ส.ว. ทั้งหมด',
          total: _.filter(this.live_vote, (i) => i.party === 'ส.ว.').length,
        },
        {
          value: 'ส.ส.',
          label: 'ส.ส. ทั้งหมด',
          total: _.filter(this.live_vote, (i) => i.party !== 'ส.ว.').length,
        },
        {
          value: 'ฝ่ายค้าน',
          label: 'ส.ส. ฝ่ายค้าน',
          total: _.filter(this.live_vote, (i) => i.team === 'ฝ่ายค้าน').length,
        },
        {
          value: 'ฝ่ายร่วมรัฐบาล',
          label: 'ส.ส. ฝ่ายร่วมรัฐบาล',
          total: _.filter(this.live_vote, (i) => i.team === 'ร่วมรัฐบาล')
            .length,
        },
      ]
    },
    table_data() {
      if (this.value === 'ทั้งหมด') {
        return this.live_vote
      } else if (this.value === 'ส.ว.') {
        return this.live_vote.filter((d) => {
          return d.party === this.value
        })
      } else if (this.value === 'ส.ส.') {
        return this.live_vote.filter((d) => {
          return d.party !== 'ส.ว.'
        })
      } else if (this.value === 'ฝ่ายค้าน') {
        return this.live_vote.filter((d) => {
          return d.team === this.value
        })
      } else if (this.value === 'ฝ่ายรัฐบาล') {
        return this.live_vote.filter((d) => {
          return d.team === this.value
        })
      } else {
        return this.live_vote.filter((d) => {
          return d.party === this.value
        })
      }
    },
  },

  async created() {
    await this.fetchConfig()
    this.fetchLive()
  },

  async asyncData({ $axios }) {
    // For development: Need to bypass CORS using extension
    // @see https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc/related
    const config = await $axios.$get(
      `${process.env.CONFIG_URL}/runtime?t=${Date.now()}`
    )
    return { config }
  },

  methods: {
    async fetchConfig() {
      // For development: Need to bypass CORS using extension
      // @see https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc/related
      this.config = await this.$axios.$get(
        `${process.env.CONFIG_URL}/runtime?t=${Date.now()}`
      )

      configUpdateInterval = this.config.update_interval.config
      dataUpdateInterval = this.config.update_interval.data

      if (configUpdateInterval) {
        setTimeout(this.fetchConfig, configUpdateInterval)
      }
    },

    async fetchLive() {
      const is_first_fetch = this.live_vote.length === 0
      const is_test = _.get(this.config, 'test') || false

      // For development: Need to bypass CORS using extension
      // @see https://chrome.google.com/webstore/detail/moesif-origin-cors-change/digfbfaphojjndkpccljibejjbppifbc/related
      const live_data_url = _.get(
        this.config,
        is_test ? 'test_live_vote_url' : 'live_vote_url'
      )
      this.live_vote = await this.$axios.$get(
        `${live_data_url}?t=${Date.now()}`
      )
      // this.live_vote = await this.$axios.$get('https://elect.in.th/con-vote/data/live_vote.json')
      this.live_vote.forEach((person) => {
        person.type = person.team + '/' + person.party
        person.fullname = `${person.title} ${person.name} ${person.lastname}`
        person.url = `https://theyworkforus.elect.in.th/people/${person.name}-${person.lastname}`
        // calculate "fresh vote" to show as blinking effect
        this.config.stages.forEach(({ id }) => {
          person[`${id}_is_fresh`] = isFresh(person, id)
        })
      })

      // Intiailize filter
      if (is_first_fetch) {
        this.setFilter()
      }

      this.setConVoteTotal()

      if (dataUpdateInterval) {
        setTimeout(this.fetchLive, dataUpdateInterval)
      }
    },

    setFilter() {
      let group_party = _.groupBy(this.live_vote, 'party')
      for (const key in group_party) {
        if (key !== 'ส.ว.') {
          this.options.push({
            value: key,
            label: `พรรค ${key}`,
            total: group_party[key].length,
          })
        }
      }
      this.options = [...this.default_options, ...this.options]
    },

    setConVoteTotal() {
      const cons = Array.from(this.config.stages.keys())

      this.con_votes = _.map(cons, (c, index) => {
        let group = _.groupBy(this.table_data, `votelog${index + 1}`)
        group = _.omit(group, ['', '#REF!'])
        group = {
          1: group[1] || [],
          2: group[2] || [],
          3: group[3] || [],
          4: group[4] || [],
        }
        let obj = {}
        let count = 0
        for (const key in group) {
          obj[key] = group[key].length
          count = count + group[key].length
          obj['count'] = count
        }
        return obj
      })
    },

    setColor(data) {
      let color = ''
      if (data === '1') {
        color = '#76C8B8'
      } else if (data === '2') {
        color = '#F0324B'
      } else if (data === '3') {
        color = '#2D3480'
      } else if (data === '4') {
        color = '#E3E3E3'
      }
      return color
    },

    calPercent(con, i) {
      const value = (con || {})[i] || 0
      const total = (con || {}).count || value

      const result = (value / total) * 100
      return result + '%'
    },
  },
  watch: {
    value() {
      this.setConVoteTotal()
    },
  },
}
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  margin: 0;
  width: 100%;
  height: 100vh;
  text-align: center;
  padding: 30px 5% 0;
}
.title-header {
  margin-top: 60px;
}
.filter-box-wrap {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}
.legend-wrap {
  display: flex;
  padding-left: 20px;
  .legend {
    display: flex;
    align-items: center;
    margin: 0 10px;
    .circle {
      width: 15px;
      height: 15px;
      border-radius: 100%;
      margin-right: 10px;
    }
    .text {
      font-size: 1.4rem;
      font-weight: 700;
    }
  }
  .legend:nth-child(1) {
    .circle {
      background: $green-100;
    }
  }
  .legend:nth-child(2) {
    .circle {
      background: $red-100;
    }
  }
  .legend:nth-child(3) {
    .circle {
      background: $blue-100;
    }
  }
  .legend:nth-child(4) {
    .circle {
      background: $grey-100;
    }
  }
}

::v-deep.el-select .el-input.is-focus .el-input__inner,
::v-deep.el-select .el-input__inner:focus,
.el-input__inner:focus {
  border-color: $grey-200;
}
.el-select-dropdown__item {
  font-size: 1.8rem;
  color: #000;
}
.el-select-dropdown__item.selected {
  color: #000;
}
.el-select-dropdown__item:hover {
  background: rgba($color: $yellow-100, $alpha: 0.5);
}
::v-deep.el-select .el-input {
  width: 250px;
}
::v-deep.el-select .el-input__inner {
  border-color: black;
  font-family: 'NotoSansThai', 'NotoSans' !important;
  font-size: 1.8rem;
  font-weight: 700;
  color: #000;
}
.el-select-dropdown__item.hover {
  background: rgba($color: $yellow-100, $alpha: 0.5);
}
.wrapper {
  margin-top: 10px;
  max-width: 100vw;
  overflow-x: auto;
  cursor: grab;

  .circle-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    .circle {
      width: 10px;
      height: 10px;
      border-radius: 100%;
      &.is-fresh {
        animation: 1s blink ease-out infinite;
      }
    }
  }

  .header {
    width: 150px;
    .chart-warp {
      width: 100%;
      display: flex;
      margin-top: 5px;
      .chart {
        height: 3px;
        width: 100%;
      }
      .chart:nth-child(1) {
        background: $green-100;
      }
      .chart:nth-child(2) {
        background: $red-100;
      }
      .chart:nth-child(3) {
        background: $blue-100;
      }
      .chart:nth-child(4) {
        background: $grey-100;
      }
    }
    .legend-wrap {
      padding-left: 0;
      justify-content: space-around;
      .legend {
        display: flex;
        align-items: center;
        margin: 0 4px;
        .circle {
          display: flex;
          align-items: center;
          width: 5px;
          height: 5px;
          margin-right: 3px;
          border-radius: 50%;
        }
        .text {
          font-size: 1rem;
        }
      }
    }
  }

  .header:nth-child(1),
  .full-name {
    min-width: 300px;
    max-width: 300px;
  }

  #vote-log-table {
    border-collapse: collapse;
    width: 100%;

    th,
    td {
      font-size: 1.6rem;
      color: #000;
      border: 1px solid black;
      padding: 8px 15px;
      text-align: left;
    }

    th {
      font-weight: 700;
      padding-top: 12px;
      padding-bottom: 12px;
      background: white;
      position: sticky;
      z-index: 1;
      top: 0;
      box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
    }

    tr:hover {
      background-color: $grey-50;
    }

    tr {
      td {
        a {
          color: #000;
          text-decoration: none;

          &:hover,
          &:active {
            text-decoration: underline;
          }
        }
      }
    }
  }
}

/* Using plain CSS */
@media (max-width: 980px) {
  .legend-wrap {
    .legend {
      .text {
        font-size: 3rem;
      }
    }
  }

  ::v-deep.el-select .el-input__inner {
    font-size: 2.4rem;
  }
  .el-select-dropdown__item {
    font-size: 2.4rem;
  }

  .wrapper {
    overflow: auto;
    #vote-log-table {
      th {
        top: 0;
        box-shadow: 0 2px 2px -1px rgba(0, 0, 0, 0.4);
        border: 1px solid black;
        vertical-align: top;
        margin: 0;
      }
      td {
        font-size: 2.4rem;
      }
      .header .legend-wrap {
        // flex-direction: column;
        display: grid;
        grid-template-columns: 50% 50%;
        .legend {
          .text {
            font-size: 2rem;
          }
          .circle {
            width: 10px;
            height: 10px;
          }
        }
      }
    }
  }
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
