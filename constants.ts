import { Book } from './types';

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: '了不起的盖茨比',
    author: 'F. Scott Fitzgerald',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApUrOEwjPBbXsOWKMz2b3vgWh72gSb63qt2W3_dHg0YvdcMQXYqstE3UysSAXvdHfDayve5fjzn07yAXJXMSP3nLocBmQ2G8E70yKcstj1lpLu5mtucXTdwSp70MKAVpQ4bwO9KU5DDvgIH5YVPoMzDEMJn97o6t-yT7Xed3LGOd_hLCIdutVV6FvKCSO3A3kDo0fPFEqm0tBW7eb6WyDXShsJU-pGw-89aRCr2mAp2P-jBY2mIlStL2AEBgODx2oxYHcvBk68JxU',
    dateAdded: '2023年10月12日',
    status: 'completed',
    content: `
      <header class="mb-12 text-center">
        <h3 class="text-slate-400 text-sm font-medium tracking-[0.2em] uppercase mb-2">第一章</h3>
        <h1 class="text-4xl font-bold dark:text-white mb-4">了不起的盖茨比</h1>
        <p class="text-slate-500 italic">F. 斯科特·菲茨杰拉德</p>
      </header>
      <article class="text-xl text-slate-800 dark:text-slate-200 leading-loose selection:bg-primary/30">
        <p class="mb-6">
            在我年纪还轻、阅历尚浅的那些年里，父亲曾给我过一句忠告，直到现在我还在脑子里反复回想。
        </p>
        <p class="mb-6">
          <span class="bg-primary/20 border-b-2 border-primary cursor-pointer hover:bg-primary/30 transition-colors" title="AI 已分析此段落">“每逢你想要批评任何人的时候，”他对我说，“你就记住，这个世界上的人并非都具备你拥有的那些优越条件。”</span>
        </p>
        <p class="mb-6">
            他没再多说什么，但我们父子之间的交流向来非常含蓄而内敛，我明白他的话里还有更深层的含义。因此，我总是不急于对他人下结论，这一习惯让我结识了许多奇特的性格，也让我成了不少无聊之辈的倾诉对象。每当这种特质出现在一个普通人身上时，那些心理不正常的人往往能敏锐地察觉并依附过来。因此，在大学时代，我曾被无辜地指责为“深谙世故”，原因就是我常常能获悉那些狂放不羁、素昧平生的人内心深处不为人知的苦闷。
        </p>
        <p class="mb-6">
            这种信任大多并非我主动寻求——每当我意识到某个明显的迹象，表明一段亲密的独白即将来临时，我往往会假装困倦、心不在焉，或者表现出一种充满敌意的轻佻；因为年轻人的内心独白，或者至少是他们表达这些独白的方式，通常都是东拼西凑，而且显然由于隐瞒而显得支离破碎。
        </p>
        <p>
            延迟评判是一种包含无限希望的姿态。我至今仍有些担心，如果我忘记了——正如我父亲曾傲慢地暗示，而我也在傲慢地重复的那样——基本的道德观念在出生时并不是平等分配的，我可能会错过一些东西。
        </p>
      </article>
    `
  },
  {
    id: '2',
    title: '杀死一只知更鸟',
    author: 'Harper Lee',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDg1tim5m8RDUWTiqitJIIwoPzvIE1KteKh2b5dUUWxVk6o-et92VWrd8M4EQiRkMZjZnc-DyV5lhfDvovYYw-GYloBgIfAXOI-Zs_hTxF0x55hJ0nHVFtETZtZUb0nkpiRNHGReGdYHmuaJlmaL2ie5YDZH1_bLlBOob6ciO7clWbI19VMt6kCa44vBRGE9L-mxasKS4HHhRuFhLyksp7TVt3Ipw1YXUIHCeJ0JyP5Sx8f_7zjx8oqv1oi5M5-sdhyL11g65vyIG4',
    dateAdded: '2023年11月04日',
    status: 'unread'
  },
  {
    id: '3',
    title: '美丽新世界',
    author: 'Aldous Huxley',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBckrpqfDMkS5KaQEAvqTyS9oswgSD85hAPtiJaRM9otHWgkI8qVSJ4lLZLs18TRAQPDukfSLcqBfnjChix38-Mf6dchCUBB2hPZAU-hAXNzPPFwZSLJqzTBFgfIuMV-FEkNtmY-S3XeNJFxbqr-89tXK3pyIJj_3fOhBsONkXLLZSTRImK-InfRKyxMQCoUkA51wLAZ0iVjA5bn30Q1CeXVu3NXLt4tqrASBEg5Oqq9Rgto_oPpn8H2tXcATY8AyICytnMpWTlZUc',
    dateAdded: '2023年12月15日',
    status: 'reading'
  },
  {
    id: '4',
    title: '沉思录',
    author: 'Marcus Aurelius',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLskSMq3rtqh1OzU-iVJyCR7Mf9TDhA63s6FP44Pvak5JJGkIBorrHDKG36XLDxCwgqBbEfe-QTEe0A_CDct7d7aH3r1ogucIzYbFdHuWKkzcSH8GPFx10G-1_BwIpo4jI8ed-OuJZuZefodqiYNa7CeJAotDPKxVT_GYWpvZTZEqTByRzhuMT7y9VEuvPyASs8ND9jAV32WvgfRymIQLSxV2QZTC6M0LWyHs-jhLLd669SiBeINF6Qlmm5uvC-p-4CpRpWw26gxg',
    dateAdded: '2024年01月02日',
    status: 'completed'
  },
  {
    id: '5',
    title: '牧羊少年奇幻之旅',
    author: 'Paulo Coelho',
    coverUrl: '', // Intentionally empty to show placeholder
    dateAdded: '2024年01月14日',
    status: 'unread'
  }
];
