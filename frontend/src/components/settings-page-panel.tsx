export function SettingsPagePanel() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">系統設定</span>
        <h1 className="page-title">先站穩單人版正式設定頁，而不是擴成企業後台。</h1>
        <p className="page-subtitle">
          這裡承接目前已正式成立的系統預設、語言規則與工作台邊界。多人登入、權限、租戶治理與企業級管理後台仍屬後續新主題。
        </p>
      </section>

      <div className="detail-grid">
        <div className="detail-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">介面與語言</h2>
                <p className="panel-copy">Infinite Pro 現階段的主頁名稱、工作面標題、按鈕、說明文與空狀態提示皆以繁體中文為預設。</p>
              </div>
            </div>
            <div className="detail-item">
              <ul className="list-content">
                <li>預設介面語言：繁體中文</li>
                <li>工作台定位：單人優先、多人相容</li>
                <li>首頁角色：正式總覽頁，而不是輸入表單頁</li>
              </ul>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">工作流與資料邊界</h2>
                <p className="panel-copy">任務、案件、來源 / 證據與交付物各自有正式工作面，避免所有內容都被壓回單一工作細節頁。</p>
              </div>
            </div>
            <div className="detail-item">
              <ul className="list-content">
                <li>案件工作台承接客戶、案件委託、工作流與決策問題等正式案件物件。</li>
                <li>交付物與來源 / 證據分別有正式工作面，不再只是摘要卡片。</li>
                <li>歷史紀錄屬於正式回看頁，不再是全站主要骨架。</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="detail-stack">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">系統層說明</h2>
                <p className="panel-copy">這一頁目前先承接單人版的正式預設與邊界，不提前變成多人治理後台。</p>
              </div>
            </div>
            <div className="detail-item">
              <ul className="list-content">
                <li>代理管理與模組包管理已獨立成頁，負責目錄、狀態與版本可視化。</li>
                <li>模型提供者與外部資料策略仍以 Host 與任務層決策為主。</li>
                <li>多人登入、權限、租戶 / 組織治理與市集層屬後續新主題。</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
