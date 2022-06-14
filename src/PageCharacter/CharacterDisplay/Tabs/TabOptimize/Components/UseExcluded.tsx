import { CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { useContext, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import SqBadge from "../../../../../Components/SqBadge";
import { DatabaseContext } from "../../../../../Database/Database";
import { DataContext } from "../../../../../DataContext";
import useBuildSetting from "../BuildSetting";

export default function UseExcluded({ disabled = false, artsDirty }: { disabled?: boolean, artsDirty: object }) {
  const { t } = useTranslation("page_character")
  const { character: { key: characterKey } } = useContext(DataContext)
  const { buildSetting: { useExcludedArts }, buildSettingDispatch } = useBuildSetting(characterKey)
  const { database } = useContext(DatabaseContext)
  const numExcludedArt = useMemo(() => artsDirty && database._getArts().reduce((a, art) => a + (art.exclude ? 1 : 0), 0), [database, artsDirty])
  return <Button fullWidth onClick={() => buildSettingDispatch({ useExcludedArts: !useExcludedArts })} disabled={!numExcludedArt || disabled} startIcon={useExcludedArts ? <CheckBox /> : <CheckBoxOutlineBlank />} color={useExcludedArts ? "success" : "secondary"}>
    <Box>
      <span><Trans t={t} i18nKey="tabOptimize.useExcluded.title" count={numExcludedArt}>Use Excluded Artifacts</Trans></span>
      {useExcludedArts && <SqBadge><Trans t={t} i18nKey="tabOptimize.useExcluded.usingNum" count={numExcludedArt}>Using <strong>{{ count: numExcludedArt }}</strong> excluded artifacts</Trans></SqBadge>}
    </Box>
  </Button>
}
