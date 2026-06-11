import {createFormHook, createFormHookContexts} from '@tanstack/react-form'
import {SubmitButton} from './components'
import {
  CheckboxField,
  DateField,
  FileField,
  RadioField,
  SelectField,
  TextAreaField,
  TextField,
} from './fields'
const {fieldContext, formContext} = createFormHookContexts()

export const {useAppForm, withForm} = createFormHook({
  fieldComponents: {
    TextField,
    TextAreaField,
    SelectField,
    CheckboxField,
    DateField,
    FileField,
    RadioField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})
