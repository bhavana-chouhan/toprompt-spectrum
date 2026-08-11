import { useCallback, useMemo } from 'react';
import { useForm, type DefaultValues, type FieldErrors, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z, ZodTypeAny } from 'zod';

export interface UseEntityFormOptions<Schema extends ZodTypeAny> {
  /**
   * Zod schema describing the form's input shape. Typically a barrel export
   * from 'shared/schemas' (e.g. NoteCreateSchema, NoteUpdateSchema).
   */
  schema: Schema;
  /**
   * Initial values for the form. Omit when creating a new entity; pass the
   * existing record when editing. Partial<> so callers don't need to specify
   * every field — react-hook-form fills the rest from the schema default.
   */
  defaultValues?: DefaultValues<z.infer<Schema>>;
  /**
   * Called with the validated values after the user submits. Anything thrown
   * inside onSubmit propagates through handleSubmit so error UI can pick it
   * up via form.formState.errors.root.
   */
  onSubmit: (values: z.infer<Schema>) => void | Promise<void>;
  /**
   * Called when validation fails. Optional — most screens rely on the
   * inline field errors that react-hook-form surfaces automatically.
   */
  onInvalid?: (errors: FieldErrors<z.infer<Schema>>) => void;
}

export interface UseEntityFormResult<Schema extends ZodTypeAny>
  extends UseFormReturn<z.infer<Schema>> {
  /**
   * Submit handler ready for <Button onPress={form.submit}>. Already
   * swallows the event arg so screens don't need a wrapper closure.
   */
  submit: () => void;
  /**
   * True while the submit handler is running OR react-hook-form is
   * validating. Use this to disable the submit button.
   */
  isBusy: boolean;
}

/**
 * Canonical form hook. Pairs react-hook-form + zod resolver so every form
 * shares the same validation pipeline and field-error surface.
 *
 * Phase 1 (mock data): onSubmit can be a no-op or local state update.
 * Phase 2 (real API):  onSubmit calls useEntityMutation's mutateAsync.
 */
export function useEntityForm<Schema extends ZodTypeAny>(
  options: UseEntityFormOptions<Schema>,
): UseEntityFormResult<Schema> {
  const { schema, defaultValues, onSubmit, onInvalid } = options;

  const resolver = useMemo(() => zodResolver(schema), [schema]);

  const form = useForm<z.infer<Schema>>({
    resolver: resolver as any,
    defaultValues,
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const submit = useCallback(() => {
    void form.handleSubmit(
      async (values) => {
        await onSubmit(values);
      },
      onInvalid ?? undefined,
    )();
  }, [form, onSubmit, onInvalid]);

  const isBusy = form.formState.isSubmitting || form.formState.isValidating;

  return Object.assign(form, { submit, isBusy });
}
