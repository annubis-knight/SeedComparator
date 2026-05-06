export type SidePanelTab = 'image' | 'providers'

export const SIDEPANEL_STORAGE_KEY = 'seedcomparator.sidepanel.collapsed'
export const SIDEPANEL_TAB_STORAGE_KEY = 'seedcomparator.sidepanel.tab'

function readCollapsed(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(SIDEPANEL_STORAGE_KEY) === 'true'
}

function readTab(): SidePanelTab {
  if (typeof localStorage === 'undefined') return 'image'
  const v = localStorage.getItem(SIDEPANEL_TAB_STORAGE_KEY)
  return v === 'providers' ? 'providers' : 'image'
}

export const useSidePanel = () => {
  const collapsed = useState<boolean>('sidepanel-collapsed', readCollapsed)
  const activeTab = useState<SidePanelTab>('sidepanel-tab', readTab)

  function persist() {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(SIDEPANEL_STORAGE_KEY, String(collapsed.value))
    localStorage.setItem(SIDEPANEL_TAB_STORAGE_KEY, activeTab.value)
  }

  function toggle() {
    collapsed.value = !collapsed.value
    persist()
  }

  function setCollapsed(value: boolean) {
    collapsed.value = value
    persist()
  }

  function setActiveTab(tab: SidePanelTab) {
    activeTab.value = tab
    if (collapsed.value) collapsed.value = false
    persist()
  }

  return { collapsed, activeTab, toggle, setCollapsed, setActiveTab }
}
