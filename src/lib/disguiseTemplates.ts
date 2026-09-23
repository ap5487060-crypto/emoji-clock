/**
 * Natural everyday disguise templates for seamless stealth messaging
 * Category-based: Friendly, Casual, Work, Greetings, Food
 */

export interface DisguiseTemplate {
  id: string;
  category: string;
  text: string;
  defaultEmoji: string;
}

export const DISGUISE_TEMPLATES: DisguiseTemplate[] = [
  {
    id: 'pizza_1',
    category: 'Casual / Food',
    text: 'Bhai kal shaam ko milte hain pizza khane',
    defaultEmoji: '🍕',
  },
  {
    id: 'bday_1',
    category: 'Wishes',
    text: 'Happy Birthday bhai! Party kab de raha hai?',
    defaultEmoji: '🎉',
  },
  {
    id: 'call_1',
    category: 'Casual',
    text: 'Acha theek hai, mai thodi der me call karta hu',
    defaultEmoji: '📞',
  },
  {
    id: 'work_1',
    category: 'Work / Study',
    text: 'Maine presentation check kar li hai, looks solid',
    defaultEmoji: '👍',
  },
  {
    id: 'chill_1',
    category: 'Friendly',
    text: 'Scene kya hai aaj ka? Shaam ko nikalte hain',
    defaultEmoji: '🔥',
  },
  {
    id: 'tea_1',
    category: 'Casual',
    text: 'Chai peene chalte hain thodi der me',
    defaultEmoji: '☕',
  },
  {
    id: 'assignment_1',
    category: 'College / Work',
    text: 'Assignment ready hai, submit kar dena time se',
    defaultEmoji: '📚',
  },
  {
    id: 'ok_1',
    category: 'Quick Reply',
    text: 'Haan bhai, sab set hai',
    defaultEmoji: '👌',
  },
  {
    id: 'night_1',
    category: 'Casual',
    text: 'Chalo so jao, baaki kal baat karte hain',
    defaultEmoji: '😴',
  },
  {
    id: 'music_1',
    category: 'Social',
    text: 'Ye naya track suna? Ekdum fire hai',
    defaultEmoji: '🎧',
  },
];

export const POPULAR_CARRIER_EMOJIS = [
  '🍕', '❤️', '🔥', '🤫', '😎', '🫡', '👀', '🎉',
  '☕', '👍', '👌', '😴', '✨', '⚡', '🥑', '🚀',
  '🎧', '🔒', '💯', '🌸', '🌮', '🍔', '🤝', '🙌'
];
