import { SectionLabel, SettingRow, ConnectButton } from './Primitives'

export function ConnectionsTab() {
  return (
    <>
      <SectionLabel>Linked Accounts</SectionLabel>
      <SettingRow
        title="42 Intra"
        subtitle="Linked to sync cursus data"
        right={<ConnectButton connected />}
      />
      <SettingRow
        title="Google"
        subtitle="Linked for easy login"
        right={<ConnectButton connected />}
      />
      <SettingRow
        title="GitHub"
        subtitle="Connect to log in with your GitHub account"
        right={<ConnectButton />}
      />
    </>
  )
}
