import { SectionLabel, SettingRow, ConnectButton } from './Primitives'

export function ProfileTab() {
  return (
    <>
      <SectionLabel>Public Profile</SectionLabel>
      <SettingRow title="Display name" value="Temp Profile User" onClick={() => {}} />
      <SettingRow title="About (bio)" value="c code gooner | 42 student" onClick={() => {}} />
      <SettingRow title="Avatar" value="Not set" onClick={() => {}} />

      <SectionLabel>Account Connections</SectionLabel>
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
    </>
  )
}

