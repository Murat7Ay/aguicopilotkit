/**
 * UI metinleri ve başlangıç chip'leri — tek dosyadan yönetilir.
 * Şablon olarak başka ekibe verirken bu dosyayı özelleştirmeleri yeterli.
 * (Araç listesi ekranda sunucudan gelir; bkz. GET /tools + ToolRegistry.)
 *
 * Ekran doğrulaması: Cursor’daki Playwright MCP (`browser_navigate` + `browser_snapshot`).
 * Önce `npm run dev`, backend için ayrıca API/proxy gerekiyorsa dotnet çalıştırın.
 */

export type StarterPrompt = {
  /** Kararlı anahtar; analytics / test için */
  id: string
  /** Modele giden tam metin */
  prompt: string
  /** Chip üzerinde gösterim; verilmezse prompt kullanılır */
  label?: string
}

export const chatSurface = {
  branding: {
    appName: 'Nakitron',
    headerSubtitle: 'Nakit yönetimi',
    /** Asistan balonu üstündeki isim */
    assistantMessageLabel: 'Nakitron',
    emptyTitle: 'Nasıl yardımcı olabilirim?',
    emptyBody:
      'Aşağıdaki örneklerden birini seçebilir veya sorunuzu yazabilirsiniz. ' +
      'Gerekirse model, yanıt üretirken aşağıda listelenen araçları kullanır.',
    logoLetter: 'N',
  },

  /** Boş ekrandaki öneri chip'leri (tanımsal) */
  starterPrompts: [
    {
      id: 'weather-istanbul',
      label: 'İstanbul hava durumu',
      prompt: "What's the weather in Istanbul?",
    },
    {
      id: 'search-agui',
      label: 'AG-UI protokolü ara',
      prompt: 'Search the web for AG-UI protocol',
    },
    {
      id: 'time-now',
      label: 'Şu an saat kaç?',
      prompt: 'What time is it now?',
    },
    {
      id: 'calc',
      label: 'Hızlı hesap',
      prompt: 'Calculate 42 * 17 + 99',
    },
    {
      id: 'translate',
      label: 'Çeviri örneği',
      prompt: "Translate 'Hello World' to Turkish",
    },
  ] satisfies readonly StarterPrompt[],

  emptyState: {
    /** Sunucu /tools yanıtına göre doldurulur; kapatmak için false */
    showToolCatalog: true,
    toolSectionTitle: 'Sunucuda kayıtlı araçlar',
  },

  status: {
    ready: 'Hazır',
    streaming: 'Yanıt alınıyor…',
  },

  actions: {
    clearChat: 'Sohbeti temizle',
  },
} as const
