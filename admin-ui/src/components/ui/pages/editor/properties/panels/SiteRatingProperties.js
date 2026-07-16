import React from "react";
import { FieldGroup, FieldLabel, TextField } from "../shared/WidgetFormControls";

const SiteRatingProperties = ({ form, updateField }) => (
  <FieldGroup>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <FieldLabel>Mock rating</FieldLabel>
        <TextField
          value={form.mock_rating_avg || "4.8"}
          onChange={(v) => updateField("mock_rating_avg", v)}
        />
      </div>
      <div>
        <FieldLabel>Mock count</FieldLabel>
        <TextField
          type="number"
          value={form.mock_rating_count || 120}
          onChange={(v) => updateField("mock_rating_count", Number(v))}
        />
      </div>
    </div>
  </FieldGroup>
);

export default SiteRatingProperties;
