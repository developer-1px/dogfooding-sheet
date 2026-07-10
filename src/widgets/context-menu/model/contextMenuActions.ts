export type MenuAction = () => void | Promise<unknown>

export const runMenuItemAction = (action: MenuAction | undefined): void => {
  try {
    void Promise.resolve(action?.()).catch(() => {})
  } catch {
    // Menu actions should not crash or leave the menu in a half-closed state.
  }
}
