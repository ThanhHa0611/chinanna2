import { useEffect, useState } from 'react';
import {
  APPLY_DEGREE_SELECT_OPTIONS,
  APPLY_LANGUAGE_OPTIONS,
  MENTOR_APPLY_DIRECTION_OPTIONS,
  researchDirectionDisplayText,
  TERM3_LANGUAGE_SHORT_OPTIONS,
  normalizeMentorApplyDirectionValue,
} from '../data/applyDegree';

function ResearchDirectionInput({
  mentee,
  menteeId,
  savingField,
  onFieldChange,
  selectClassName,
  disabled,
}) {
  const id = menteeId || mentee.id;
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setDraft(researchDirectionDisplayText(mentee));
  }, [mentee?.id, mentee?.research_direction, mentee?.research_direction_label]);

  const isSaving = savingField === `${id}:research_direction`;

  return (
    <label className="mentee-classification-field">
      <span className="info-label">Phương hướng NC (mentor điền)</span>
      <input
        type="text"
        className={selectClassName}
        value={draft}
        placeholder="VD: Hướng NC, NC kinh tế..."
        disabled={disabled || isSaving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const trimmed = draft.trim();
          const current = researchDirectionDisplayText(mentee);
          if (trimmed !== current) {
            onFieldChange(id, 'research_direction', trimmed);
          }
        }}
      />
    </label>
  );
}

export default function MenteeClassificationFields({
  mentee,
  menteeId,
  savingField = '',
  onFieldChange,
  showDirection = false,
  showTerm = false,
  showDegree = true,
  showResearchDirection = false,
  showLanguage = false,
  selectClassName = 'mentee-class-select',
  disabled = false,
}) {
  if (!mentee) return null;

  const id = menteeId || mentee.id;
  const directionValue = normalizeMentorApplyDirectionValue(mentee.mentor_apply_direction);

  const isSaving = (field) => savingField === `${id}:${field}`;

  return (
    <div className="mentee-classification-grid">
      {showDirection && (
        <label className="mentee-classification-field">
          <span className="info-label">Hướng apply (khối ngành)</span>
          <select
            className={selectClassName}
            value={directionValue}
            disabled={disabled || isSaving('mentor_apply_direction')}
            onChange={(e) => onFieldChange(id, 'mentor_apply_direction', e.target.value)}
          >
            {MENTOR_APPLY_DIRECTION_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {showResearchDirection && (
        <ResearchDirectionInput
          mentee={mentee}
          menteeId={id}
          savingField={savingField}
          onFieldChange={onFieldChange}
          selectClassName={selectClassName}
          disabled={disabled}
        />
      )}
      {showDegree && (
        <label className="mentee-classification-field">
          <span className="info-label">Hệ apply</span>
          <select
            className={selectClassName}
            value={mentee.apply_degree_level || ''}
            disabled={disabled || isSaving('apply_degree_level')}
            onChange={(e) => onFieldChange(id, 'apply_degree_level', e.target.value)}
          >
            {APPLY_DEGREE_SELECT_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {showLanguage && (
        <label className="mentee-classification-field">
          <span className="info-label">Hệ tiếng</span>
          <select
            className={selectClassName}
            value={mentee.scholarship_system || ''}
            disabled={disabled || isSaving('scholarship_system')}
            onChange={(e) => onFieldChange(id, 'scholarship_system', e.target.value)}
          >
            {APPLY_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
      {showTerm && (
        <label className="mentee-classification-field">
          <span className="info-label">Kì tiếng 3/2027 (1 kì tiếng)</span>
          <select
            className={selectClassName}
            value={mentee.term3_2027_language_semester || ''}
            disabled={disabled || isSaving('term3_2027_language_semester')}
            onChange={(e) => onFieldChange(id, 'term3_2027_language_semester', e.target.value)}
          >
            {TERM3_LANGUAGE_SHORT_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
