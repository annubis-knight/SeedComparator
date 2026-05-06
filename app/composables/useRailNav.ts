/**
 * STORY-099 : état collapse du RailNav, distinct du SidePanel.
 * Persisté en localStorage pour cohérence avec le pattern existant.
 */

export const RAILNAV_STORAGE_KEY = 'seedcomparator.railnav.collapsed'

function readCollapsed(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(RAILNAV_STORAGE_KEY) === 'true'
}

export const useRailNav = () => {
  const collapsed = useState<boolean>('railnav-collapsed', readCollapsed)

  function toggle() {
    collapsed.value = !collapsed.value
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RAILNAV_STORAGE_KEY, String(collapsed.value))
    }
  }

  return { collapsed, toggle }
}
