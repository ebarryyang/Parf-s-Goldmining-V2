
import React from 'react';
import { PetCategory } from './types';

export const STORAGE_KEY_USER = 'parfai_user_v2';
export const STORAGE_KEY_BOOKS = 'parfai_books';
export const STORAGE_KEY_STATS = 'parfai_stats';
export const STORAGE_KEY_LOGS = 'parfai_logs';
export const STORAGE_KEY_PETS = 'parfai_pets';
export const STORAGE_KEY_GAME = 'parfai_game_progress';
export const STORAGE_KEY_INVITE_CODES = 'parfai_generated_codes'; // New Key

export const VALID_INVITE_CODE = 'lovebook2050';
export const TRIAL_DAYS = 5;

export const SHOVEL_COST_PER_DIG = 1;
export const COINS_PER_DIG = 40;
export const COINS_TO_PASS_LEVEL = 800;
export const MAX_DAILY_STAMINA = 20;

export const LEVELS = [
  { name: "埃及金字塔", theme: "desert", bg: "#87CEEB", ground: "#E6C288", text: "#000" },
  { name: "美国西部大草原", theme: "canyon", bg: "#87CEEB", ground: "#CD853F", text: "#000" },
  { name: "加利福尼亚沿海公路", theme: "coast", bg: "#00BFFF", ground: "#F4A460", text: "#000" },
  { name: "纽约中央公园", theme: "city", bg: "#ADD8E6", ground: "#556B2F", text: "#000" },
  { name: "中国长城", theme: "mountain", bg: "#87CEFA", ground: "#808080", text: "#000" },
  { name: "夏威夷海岛", theme: "island", bg: "#00CED1", ground: "#F0E68C", text: "#000" },
  { name: "法国薰衣草田", theme: "field", bg: "#E6E6FA", ground: "#9370DB", text: "#000" },
  { name: "澳大利亚黄金海岸", theme: "beach", bg: "#1E90FF", ground: "#FFD700", text: "#000" },
  { name: "南极大陆", theme: "snow", bg: "#F0F8FF", ground: "#DEE2E6", text: "#000" },
  { name: "内蒙古大草原", theme: "grassland", bg: "#87CEEB", ground: "#228B22", text: "#FFF" },
  { name: "月球", theme: "space", bg: "#000000", ground: "#696969", text: "#FFF" },
  { name: "火星", theme: "mars", bg: "#4A0404", ground: "#CD5C5C", text: "#FFF" },
  { name: "英国巨人阵", theme: "ruins", bg: "#778899", ground: "#556B2F", text: "#FFF" },
  { name: "玛雅金字塔遗迹", theme: "jungle", bg: "#228B22", ground: "#8B4513", text: "#FFF" },
  { name: "古罗马街道", theme: "ancient", bg: "#87CEEB", ground: "#A0522D", text: "#000" },
  { name: "希腊神庙", theme: "temple", bg: "#87CEEB", ground: "#F5F5F5", text: "#000" },
];

// Data Generators with Icons and Fixed Rarity
export const MAMMALS = [
  { name: "考拉", region: "澳大利亚", icon: "🐨", rarity: 3 },
  { name: "大熊猫", region: "中国四川", icon: "🐼", rarity: 5 },
  { name: "非洲狮", region: "非洲草原", icon: "🦁", rarity: 4 },
  { name: "北极熊", region: "北极圈", icon: "🐻‍❄️", rarity: 4 },
  { name: "红袋鼠", region: "澳大利亚", icon: "🦘", rarity: 3 },
  { name: "长颈鹿", region: "肯尼亚", icon: "🦒", rarity: 3 },
  { name: "水豚", region: "南美洲", icon: "🥔", rarity: 2 }, 
  { name: "藏羚羊", region: "青藏高原", icon: "🐐", rarity: 4 },
  { name: "美洲豹", region: "亚马逊雨林", icon: "🐆", rarity: 4 },
  { name: "狐猴", region: "马达加斯加", icon: "🐒", rarity: 2 },
  { name: "大象", region: "泰国", icon: "🐘", rarity: 3 },
  { name: "斑马", region: "坦桑尼亚", icon: "🦓", rarity: 2 },
  { name: "老虎", region: "西伯利亚", icon: "🐅", rarity: 5 }
];

export const POP_CULTURE = [
  { name: "吉伊卡哇 (Chikawa)", icon: "🐹", rarity: 4 },
  { name: "哈契瓦 (Hachiware)", icon: "🐱", rarity: 3 },
  { name: "乌萨奇 (Usagi)", icon: "🐰", rarity: 5 },
  { name: "Hello Kitty", icon: "🎀", rarity: 4 },
  { name: "酷洛米", icon: "😈", rarity: 4 },
  { name: "大耳狗", icon: "🐶", rarity: 3 },
  { name: "美乐蒂", icon: "👒", rarity: 3 },
  { name: "米奇", icon: "🐭", rarity: 5 },
  { name: "唐老鸭", icon: "🦆", rarity: 4 },
  { name: "史迪奇", icon: "👽", rarity: 4 },
  { name: "巴斯光年", icon: "👨‍🚀", rarity: 4 },
  { name: "蜘蛛侠", icon: "🕷️", rarity: 5 },
  { name: "钢铁侠", icon: "🦾", rarity: 5 },
  { name: "格鲁特", icon: "🌳", rarity: 3 },
  { name: "美国队长", icon: "🛡️", rarity: 5 }
];

export const TREASURES = [
  { name: "希望蓝钻", icon: "💎", rarity: 5 },
  { name: "女王的权杖", icon: "🪄", rarity: 4 },
  { name: "黄金面具", icon: "👺", rarity: 5 },
  { name: "古代法典", icon: "📜", rarity: 3 },
  { name: "红宝石王冠", icon: "👑", rarity: 5 },
  { name: "海盗金币", icon: "🪙", rarity: 2 },
  { name: "翡翠白菜", icon: "🥬", rarity: 4 },
  { name: "恐龙化石", icon: "🦖", rarity: 5 },
  { name: "外星陨石", icon: "☄️", rarity: 4 },
  { name: "神秘钥匙", icon: "🗝️", rarity: 3 },
  { name: "圣杯", icon: "🏆", rarity: 5 },
  { name: "古老戒指", icon: "💍", rarity: 3 }
];
