# AG-UI Chat Demo — Geliştirme Planı

> Bu doküman mevcut demo projesine eklenebilecek tüm özellikleri **AG-UI Protokolü**, **CopilotKit UI** ve **LLM Agent Layer** perspektiflerinden kapsamlı şekilde listeler. Her özellik için zorluk seviyesi, bağımlılıklar ve kısa açıklama verilmiştir.
>
> **İnceledikten sonra istediğin maddeleri seç, implementasyona geçelim.**

---

## Zorluk Seviyeleri

| Seviye | Açıklama |
|--------|----------|
| 🟢 Düşük | Birkaç saat, çoğunlukla UI değişikliği |
| 🟡 Orta | 1-2 gün, backend + frontend birlikte |
| 🟠 Yüksek | 2-5 gün, mimari değişiklik veya yeni altyapı |
| 🔴 Çok Yüksek | 1+ hafta, platform seviyesi iş |

---

## A. AG-UI Protokol Katmanı (Backend Events)

Mevcut backend'imiz sadece temel event'leri gönderiyor. AG-UI protokolü çok daha zengin.

### A1. Reasoning / Thinking Events 🟡
**Mevcut durumda yok.**

AG-UI `REASONING_START`, `REASONING_MESSAGE_START`, `REASONING_MESSAGE_CONTENT`, `REASONING_MESSAGE_END`, `REASONING_END` event'lerini destekler. Bu sayede:
- AI'ın "düşünme" sürecini kullanıcıya gösterebilirsin
- Collapsible "thinking" blokları oluşturabilirsin
- OpenAI'ın reasoning modelleri (o1, o3 vb.) ile doğal entegrasyon

**Backend değişiklik:** OpenAI streaming'den reasoning token'ları yakalayıp yeni event'ler emit et.
**Frontend değişiklik:** Thinking bubble component'i ekle.

---

### A2. Step Events (İlerleme Adımları) 🟡
**Mevcut durumda yok.**

`STEP_STARTED` ve `STEP_FINISHED` event'leri ile agent'ın çalışma adımlarını gösterebilirsin:
- "Kullanıcı mesajını analiz ediyorum..."
- "Hava durumu aracını çağırıyorum..."
- "Sonuçları özetliyorum..."

**Backend değişiklik:** Her aşamada step event'leri emit et.
**Frontend değişiklik:** Step progress bar / checklist component'i.

---

### A3. Activity Events (Zengin Aktivite Kartları) 🟠
**Mevcut durumda yok.**

`ACTIVITY_SNAPSHOT` ve `ACTIVITY_DELTA` event'leri ile:
- Arama sonuçları kartları
- Plan/görev listeleri
- Canlı güncellenen yapılandırılmış veri blokları

**Backend değişiklik:** Aktivite JSON'ları emit et.
**Frontend değişiklik:** Activity card renderer.

---

### A4. Shared State (Paylaşımlı Durum) 🟠
**Mevcut durumda yok.**

`STATE_SNAPSHOT` ve `STATE_DELTA` (JSON Patch - RFC 6902) event'leri ile:
- Frontend ve backend arasında senkronize durum
- Formlar, listeler, dashboard'lar agent tarafından güncellenebilir
- "Predictive state updates" — agent çalışırken UI anlık güncellenir

**Backend değişiklik:** State management + delta emission.
**Frontend değişiklik:** State store + reactive UI binding.

---

### A5. Messages Snapshot (Mesaj Senkronizasyonu) 🟡
**Mevcut durumda yok.**

`MESSAGES_SNAPSHOT` event'i ile:
- Sayfa yenilendiğinde sohbet geçmişi geri yüklenir
- Çoklu cihaz desteği
- Thread'e katılma senaryoları

**Backend değişiklik:** Thread bazlı mesaj persistance + snapshot event.
**Frontend değişiklik:** Reconnect logic.

---

### A6. Custom Events 🟢
**Mevcut durumda yok.**

`CUSTOM` event'i (`name` + `value`) ile:
- Analytics event'leri
- Feature flag'leri
- Özel widget tetikleyicileri
- Bildirimler

**Backend değişiklik:** Custom event emit helper.
**Frontend değişiklik:** Custom event handler + renderer.

---

### A7. Tool Call Result Event 🟢
**Kısmen mevcut (tool call start/args/end var ama result yok).**

`TOOL_CALL_RESULT` event'i ile:
- Tool çalıştıktan sonra sonucu ayrı bir event olarak gönder
- Frontend'de tool sonuçlarını zengin şekilde göster

**Backend değişiklik:** ExecuteToolCallsAsync'de result event emit et.
**Frontend değişiklik:** Tool result card component.

---

### A8. Human-in-the-Loop / Interrupts 🟠
**Mevcut durumda yok.**

AG-UI draft'ında `RUN_FINISHED` event'ine `outcome: "interrupt"` + `interrupt: { id, reason, payload }` ekleniyor:
- Onay gerektiren aksiyonlar (silme, ödeme, vb.)
- Kullanıcı müdahalesi bekleme
- Approve / Reject / Edit akışları

**Backend değişiklik:** Interrupt mekanizması + resume endpoint.
**Frontend değişiklik:** Approval dialog component.

---

### A9. Agent Capabilities Discovery 🟢
**Mevcut durumda yok.**

`getCapabilities` endpoint'i ile frontend agent'ın neleri desteklediğini keşfeder:
- Hangi tool'lar var
- Multimodal mı
- State paylaşıyor mu
- HITL destekliyor mu

**Backend değişiklik:** /capabilities GET endpoint.
**Frontend değişiklik:** Adaptive UI (desteklenmeyen özellikler gizlenir).

---

## B. CopilotKit UI Katmanı

Mevcut frontend custom hook kullanıyor. CopilotKit'in hazır bileşenlerine geçiş veya entegrasyon yapılabilir.

### B1. CopilotKit Provider + CopilotChat Entegrasyonu 🟡
**Mevcut durumda custom UI var.**

CopilotKit'in hazır `CopilotChat` / `CopilotSidebar` / `CopilotPopup` bileşenlerini kullanmak:
- Hazır mesaj listesi, input, suggestion'lar
- Tema desteği, label özelleştirme
- Markdown rendering dahili

**Gereksinim:** CopilotKit runtime (Node.js proxy) veya doğrudan AG-UI agent bağlantısı.

---

### B2. useAgent Hook (v2) ile AG-UI Bağlantısı 🟡
**Mevcut durumda custom useAgUI hook var.**

CopilotKit v2'nin `useAgent` hook'u ile:
- `@ag-ui/client` üzerinden doğrudan AG-UI bağlantısı
- Otomatik event parsing
- State sync, tool rendering, interrupt handling dahili

**Gereksinim:** `@copilotkit/react-core/v2` import'u + CopilotKitProvider.

---

### B3. Generative UI (useRenderTool / useComponent) 🟠
**Mevcut durumda tool call'lar basit badge olarak gösteriliyor.**

CopilotKit'in `useRenderTool` hook'u ile tool çağrılarına özel React component'leri bağla:
- Hava durumu tool'u → güzel bir weather card
- Arama tool'u → sonuç listesi kartı
- Hesaplama tool'u → matematik gösterimi
- Her tool için `inProgress` / `executing` / `complete` state'leri

---

### B4. Frontend Tools (useFrontendTool) 🟡
**Mevcut durumda tüm tool'lar backend'de.**

Frontend'de çalışan tool'lar tanımla:
- Clipboard'a kopyalama
- Sayfa navigasyonu
- Form doldurma
- Local storage işlemleri
- Browser API'leri (geolocation, notification, vb.)

**Agent bu tool'ları çağırır, browser'da çalışır, sonuç agent'a geri döner.**

---

### B5. useCopilotReadable (Bağlam Paylaşımı) 🟢
**Mevcut durumda yok.**

Frontend'deki veriyi agent'a otomatik bağlam olarak gönder:
- Sayfadaki form verileri
- Kullanıcı tercihleri
- Uygulama durumu

---

### B6. Chat Suggestions (Öneri Sistemi) 🟢
**Mevcut durumda statik butonlar var.**

CopilotKit'in `useCopilotChatSuggestions` veya v2 `useConfigureSuggestions` ile:
- LLM tarafından dinamik olarak üretilen öneriler
- Bağlama göre değişen suggestion'lar
- Her mesajdan sonra yeni öneriler

---

### B7. A2UI (Agent-to-UI) Renderer 🟠
**Mevcut durumda yok.**

Google'ın A2UI spec'i ile agent'ın UI bileşenleri üretmesi:
- Card, Button, Table, List gibi primitifler
- Agent response'unda JSONL UI payload'ı
- `@copilotkit/a2ui-renderer` ile render

---

### B8. Thread Persistence (Sohbet Geçmişi) 🟡
**Mevcut durumda sayfa yenilenince sohbet kayboluyor.**

- Thread ID bazlı sohbet kaydetme
- Sohbet listesi sidebar'ı
- Geçmiş sohbetlere dönme
- Thread silme / arşivleme

**Backend değişiklik:** Thread storage (SQLite/file/DB).
**Frontend değişiklik:** Thread list sidebar component.

---

### B9. Markdown Rendering + Code Highlighting 🟢
**Mevcut durumda düz metin gösteriliyor.**

- `react-markdown` ile markdown parse
- `react-syntax-highlighter` veya `shiki` ile kod renklendirme
- GFM tabloları, listeler, başlıklar
- Kod bloklarında kopyalama butonu
- LaTeX/KaTeX math desteği

---

### B10. CopilotKit Inspector (Debug) 🟢
**Mevcut durumda yok.**

Geliştirme sırasında:
- Gönderilen/alınan event'leri göster
- Tool call detayları
- State snapshot'ları
- Network trafiği

---

## C. LLM / Agent Katmanı

### C1. Streaming Markdown Rendering 🟢
**Mevcut durumda düz metin streaming var.**

- Token'lar gelirken markdown'ı parse et
- Tamamlanmamış blokları graceful handle et
- Typing cursor / shimmer efekti
- Kod bloklarında progressive rendering

---

### C2. Zengin Tool Call Visualization 🟡
**Mevcut durumda basit badge var.**

- Tool kartları: isim, argümanlar, durum, süre
- Genişletilebilir detay paneli (raw I/O)
- Timeline görünümü (çoklu tool çağrısı)
- Hata durumu gösterimi
- Tool çağrısı animasyonları

---

### C3. Multi-Modal Destek 🟠
**Mevcut durumda sadece metin.**

- **Görsel giriş:** Sürükle-bırak veya yapıştır ile resim gönderme
- **Görsel çıkış:** DALL-E / GPT-4o ile üretilen görseller
- **Dosya yükleme:** PDF, DOCX, CSV analizi
- **Ses giriş/çıkış:** Mikrofon ile konuşma, TTS ile yanıt okuma

---

### C4. Voice Input / Output 🟡-🟠
**Mevcut durumda yok.**

- **Basit:** Web Speech API ile STT/TTS (🟡)
- **Gelişmiş:** OpenAI Whisper + TTS API (🟠)
- **İleri:** Full-duplex voice agent, barge-in (🔴)

---

### C5. Agent Workflow Visualization 🟠
**Mevcut durumda yok.**

- Step listesi (lineer ilerleme)
- Dallanma gösterimi (hangi yol seçildi)
- DAG/graf görünümü (LangGraph Studio tarzı)
- Canlı execution overlay

---

### C6. Artifact / Canvas Paneli 🟠
**Mevcut durumda yok.**

Claude Artifacts / ChatGPT Canvas tarzı:
- Chat + yan panel (split view)
- Kod, doküman, HTML preview
- Versiyon geçmişi ve diff
- Export (HTML, PNG, PDF)
- Canlı önizleme (sandboxed iframe)

---

### C7. RAG Visualization (Kaynak Gösterimi) 🟡
**Mevcut durumda yok.**

- Footnote citation'ları [1], [2]
- Tıklanabilir kaynak referansları
- Yan panelde kaynak detayı
- Güvenilirlik skoru gösterimi

---

### C8. Kod Çalıştırma Sandbox 🟠-🔴
**Mevcut durumda yok.**

- Browser'da JS çalıştırma (sandboxed iframe) (🟠)
- Uzak sandbox (E2B, Modal) (🔴)
- Notebook tarzı hücreler (🔴)
- Çıktı stream'i (stdout, stderr, görseller)

---

### C9. Conversation Branching (Dal Oluşturma) 🟠
**Mevcut durumda yok.**

- Mesaj düzenleme → yeni dal
- "Buradan devam et" ile fork
- Dal karşılaştırma (side-by-side)
- Dal ağacı görselleştirme

---

### C10. Export & Paylaşım 🟢-🟡
**Mevcut durumda yok.**

- Markdown / plain text export (🟢)
- PDF / HTML export (🟡)
- Paylaşım linki (🟠)
- JSON API export (🟢)

---

### C11. Prompt Templates & Quick Actions 🟢
**Mevcut durumda statik öneriler var.**

- Slash command sistemi (`/translate`, `/summarize`)
- Değişkenli template'ler (`{{konu}}`)
- Kategori bazlı template kütüphanesi
- Tek tıkla aksiyonlar (özetle, düzelt, çevir)

---

### C12. Real-Time Data Visualization 🟡-🟠
**Mevcut durumda yok.**

- Tool sonuçlarından otomatik chart üretimi
- Recharts / ECharts entegrasyonu
- İnteraktif filtreler (tarih aralığı, slider)
- Dashboard tile'ları

---

### C13. Multi-Agent UI 🟠
**Mevcut durumda tek agent.**

- Farklı agent'lar için avatar/etiket
- Handoff kartları ("X agent'ına aktarıldı")
- Paralel agent stream'leri
- Orchestrator overview

---

### C14. Memory & Context Yönetimi UI 🟡
**Mevcut durumda yok.**

- Token kullanım göstergesi
- Pinned/saved context blokları
- Eski mesajların otomatik özetlenmesi
- Per-thread vs global memory ayrımı

---

### C15. Erişilebilirlik (Accessibility) 🟡
**Mevcut durumda temel düzeyde.**

- Screen reader desteği (streaming content için aria-live)
- Keyboard navigation (tool kartları, mesajlar)
- Yüksek kontrast tema
- Focus management

---

## Önerilen Uygulama Öncelik Sırası

Hızlı etki ve düşük zorluktan başlayarak:

### Faz 1 — Temel İyileştirmeler (🟢 Düşük)
1. **B9** — Markdown rendering + kod highlighting
2. **A7** — Tool call result event
3. **A6** — Custom events
4. **C11** — Slash commands / prompt templates
5. **C10** — Export (markdown/JSON)
6. **B5** — useCopilotReadable bağlam paylaşımı

### Faz 2 — Orta Seviye Özellikler (🟡 Orta)
7. **A1** — Reasoning/thinking events
8. **A2** — Step events (ilerleme)
9. **C2** — Zengin tool call visualization
10. **B6** — Dinamik chat suggestions
11. **B8** — Thread persistence
12. **C14** — Memory & context UI
13. **C4** — Voice input (basit STT/TTS)

### Faz 3 — Gelişmiş Özellikler (🟠 Yüksek)
14. **B3** — Generative UI (tool-specific components)
15. **A4** — Shared state
16. **A8** — Human-in-the-loop / interrupts
17. **C3** — Multi-modal (görsel giriş/çıkış)
18. **C6** — Artifact/canvas paneli
19. **C7** — RAG visualization
20. **C12** — Data visualization (charts)

### Faz 4 — Platform Özellikleri (🔴 Çok Yüksek)
21. **C5** — Agent workflow DAG visualization
22. **C9** — Conversation branching
23. **C13** — Multi-agent UI
24. **C8** — Kod çalıştırma sandbox
25. **B7** — A2UI renderer

---

## Notlar

- Her özellik bağımsız olarak implement edilebilir
- Faz numaraları öneri niteliğindedir, istediğin sırada seçebilirsin
- Backend (.NET) ve Frontend (React) değişiklikleri her maddede belirtilmiştir
- CopilotKit entegrasyonu (B1, B2) yapılırsa birçok özellik hazır gelir ama custom UI esnekliği azalır
- Mevcut custom hook yaklaşımı daha fazla kontrol sağlar

---

*Bu doküman araştırma tarihiyle günceldir: 1 Nisan 2026*
*Kaynaklar: [AG-UI Docs](https://docs.ag-ui.com/), [CopilotKit Docs](https://docs.copilotkit.ai/), [AG-UI GitHub](https://github.com/ag-ui-protocol/ag-ui), [Microsoft Agent Framework](https://learn.microsoft.com/en-us/agent-framework/)*
