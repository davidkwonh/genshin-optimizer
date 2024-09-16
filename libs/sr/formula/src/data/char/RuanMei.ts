import {
  cmpEq,
  cmpGE,
  max,
  prod,
  subscript,
  sum,
} from '@genshin-optimizer/pando/engine'
import { type CharacterKey } from '@genshin-optimizer/sr/consts'
import { allStats } from '@genshin-optimizer/sr/stats'
import {
  allBoolConditionals,
  customBreakDmg,
  enemy,
  enemyDebuff,
  notOwnBuff,
  own,
  ownBuff,
  register,
  registerBuff,
  registerBuffFormula,
  teamBuff,
} from '../util'
import { dmg, entriesForChar, getBaseTag, scalingParams } from './util'

const key: CharacterKey = 'RuanMei'
const data_gen = allStats.char[key]
const baseTag = getBaseTag(data_gen)
const {
  basic,
  skill,
  ult,
  talent,
  technique,
  eidolon,
  bonusAbility1,
  bonusAbility2,
  bonusAbility3,
} = scalingParams(data_gen)

let s = 0,
  u = 0,
  ta = 0,
  te = 0
const dm = {
  basic: {
    dmg: basic[0][0],
  },
  skill: {
    dmg_: skill[0][s++],
    weakness_: skill[0][s++][0],
    duration: skill[0][s++][0],
  },
  ult: {
    resPen_: ult[0][u++],
    duration: ult[0][u++][0],
    delay: ult[0][u++][0],
    delayFromBreak: ult[0][u++],
    breakDmg: ult[0][u++],
  },
  talent: {
    spd_: talent[0][ta++],
    breakDmg: talent[0][ta++],
  },
  technique: {
    triggers: technique[te++],
    toughness_: technique[te++],
    breakDmg: technique[te++],
    maxBlessings: technique[te++],
  },
  b1: {
    break_: bonusAbility1[0],
  },
  b2: {
    energy: bonusAbility2[0],
  },
  b3: {
    breakThreshold: bonusAbility3[0],
    breakPer: bonusAbility3[1],
    dmg_per: bonusAbility3[2],
    max_dmg_: bonusAbility3[3],
  },
  e1: {
    defIgn_: eidolon[1][0],
  },
  e2: {
    atk_: eidolon[2][0],
  },
  e4: {
    break_: eidolon[4][0],
    duration: eidolon[4][1],
  },
  e6: {
    ultDurationInc: eidolon[6][0],
    breakDmgMult_inc: eidolon[6][1],
  },
} as const

const { char } = own

const { skillOvertone, ultZone, e4Broken } = allBoolConditionals(key)

const e6TechniqueAddMult = cmpGE(char.eidolon, 6, dm.e6.breakDmgMult_inc)

const sheet = register(
  key,
  // Handles base stats, StatBoosts and Eidolon 3 + 5
  entriesForChar(data_gen),

  // Formulas
  ...dmg('basicDmg', baseTag, 'atk', dm.basic.dmg, 'basic'),
  ...customBreakDmg(
    'zoneBreakDmg',
    { ...baseTag, damageType1: 'break' },
    subscript(char.ult, dm.ult.breakDmg)
  ),
  ...customBreakDmg(
    'talentBreakDmg',
    { ...baseTag, damageType1: 'break' },
    subscript(char.talent, dm.talent.breakDmg)
  ),
  ...customBreakDmg(
    'techBreakDmg',
    { ...baseTag, damageType1: 'break' },
    sum(dm.technique.breakDmg, e6TechniqueAddMult)
  ),

  // Buffs
  registerBuff(
    'skillOvertone_dmg_',
    teamBuff.premod.dmg_.add(
      skillOvertone.ifOn(subscript(char.skill, dm.skill.dmg_))
    )
  ),
  // TODO: Break efficiency
  registerBuff(
    'skillOvertone_weakness_',
    teamBuff.premod.weakness_.add(skillOvertone.ifOn(dm.skill.weakness_))
  ),
  registerBuff(
    'ultZone_resPen_',
    teamBuff.premod.resPen_.add(
      ultZone.ifOn(subscript(char.ult, dm.ult.resPen_))
    )
  ),
  registerBuff(
    'talent_spd_',
    notOwnBuff.premod.spd_.add(subscript(char.talent, dm.talent.spd_))
  ),
  registerBuff(
    'ba1_break_',
    teamBuff.premod.brEffect_.add(cmpEq(char.bonusAbility1, 1, dm.b1.break_))
  ),
  registerBuffFormula(
    'ba3_brEff_',
    teamBuff.premod.dmg_.add(
      cmpEq(
        char.bonusAbility3,
        1,
        skillOvertone.ifOn(
          max(
            // (brEff_ - breakThreshold) / breakPer * dmgPer
            prod(
              sum(own.final.brEffect_, -dm.b3.breakThreshold),
              1 / dm.b3.breakPer,
              dm.b3.dmg_per
            ),
            dm.b3.max_dmg_
          )
        )
      )
    )
  ),
  registerBuff(
    'e1_defIgn_',
    enemyDebuff.common.defIgn_.add(cmpGE(char.eidolon, 1, dm.e1.defIgn_))
  ),
  registerBuff(
    'e2_atk_',
    teamBuff.premod.atk_.add(
      cmpGE(char.eidolon, 2, cmpEq(enemy.common.isBroken, 1, dm.e2.atk_))
    )
  ),
  registerBuff(
    'e4_break_',
    ownBuff.premod.brEffect_.add(
      cmpGE(char.eidolon, 4, e4Broken.ifOn(dm.e4.break_))
    )
  )
)
export default sheet
