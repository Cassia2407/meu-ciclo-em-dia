import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouteContext } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isAdult } from "./age";
import { daysBetween } from "./cycle";

export type Profile = Tables<"profiles">;
export type MenstrualRecord = Tables<"menstrual_records">;
export type SymptomRecord = Tables<"symptom_records">;
export type SexualRecord = Tables<"sexual_activity_records">;
export type EducationalContent = Tables<"educational_content">;

export const qk = {
  profile: ["profile"] as const,
  menstrual: ["menstrual_records"] as const,
  symptoms: ["symptom_records"] as const,
  sexual: ["sexual_activity_records"] as const,
  content: ["educational_content"] as const,
};

export function useCurrentUser() {
  return useRouteContext({ from: "/_authenticated" }).user;
}

export function useProfile() {
  return useQuery({
    queryKey: qk.profile,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Adult status derived only from the stored birth date. The database enforces it too. */
export function useIsAdult() {
  const { data } = useProfile();
  return data ? isAdult(data.birth_date) : false;
}

export function useMenstrualRecords() {
  return useQuery({
    queryKey: qk.menstrual,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menstrual_records")
        .select("*")
        .order("record_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useSymptomRecords() {
  return useQuery({
    queryKey: qk.symptoms,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("symptom_records")
        .select("*")
        .order("record_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useSexualRecords(enabled: boolean) {
  return useQuery({
    queryKey: qk.sexual,
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sexual_activity_records")
        .select("*")
        .order("record_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useEducationalContent() {
  return useQuery({
    queryKey: qk.content,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("educational_content")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export type DayLogInput = {
  date: string;
  bleeding: boolean | null;
  flow: string | null;
  cramps: string | null;
  bloating: string | null;
  symptoms: string[];
  otherSymptom: string;
  notes: string;
  /** Only sent for adults. undefined = leave untouched. */
  sexual?: { had: boolean; notes: string };
};

function useInvalidateRecords() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: qk.menstrual }),
      qc.invalidateQueries({ queryKey: qk.symptoms }),
      qc.invalidateQueries({ queryKey: qk.sexual }),
    ]);
}

export function useSaveDayLog() {
  const user = useCurrentUser();
  const invalidate = useInvalidateRecords();
  return useMutation({
    mutationFn: async (input: DayLogInput) => {
      const { date } = input;

      if (input.bleeding === true) {
        const { error } = await supabase
          .from("menstrual_records")
          .upsert(
            { user_id: user.id, record_date: date, flow: input.flow },
            { onConflict: "user_id,record_date" },
          );
        if (error) throw error;
      } else if (input.bleeding === false) {
        const { error } = await supabase.from("menstrual_records").delete().eq("record_date", date);
        if (error) throw error;
      }

      const other = input.otherSymptom.trim();
      const notes = input.notes.trim();
      const hasSymptoms =
        !!input.cramps || !!input.bloating || input.symptoms.length > 0 || !!other || !!notes;
      if (hasSymptoms) {
        const { error } = await supabase.from("symptom_records").upsert(
          {
            user_id: user.id,
            record_date: date,
            cramps: input.cramps,
            bloating: input.bloating,
            symptoms: input.symptoms,
            other_symptom: other || null,
            notes: notes || null,
          },
          { onConflict: "user_id,record_date" },
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.from("symptom_records").delete().eq("record_date", date);
        if (error) throw error;
      }

      if (input.sexual) {
        if (input.sexual.had) {
          const { error } = await supabase.from("sexual_activity_records").upsert(
            { user_id: user.id, record_date: date, notes: input.sexual.notes.trim() || null },
            { onConflict: "user_id,record_date" },
          );
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("sexual_activity_records")
            .delete()
            .eq("record_date", date);
          if (error) throw error;
        }
      }
    },
    onSuccess: invalidate,
  });
}

export function useAddPeriodRange() {
  const user = useCurrentUser();
  const invalidate = useInvalidateRecords();
  return useMutation({
    mutationFn: async (input: { start: string; end: string; flow: string | null }) => {
      // Omit flow when not chosen so existing per-day flow values are kept.
      const rows = daysBetween(input.start, input.end).map((d) => ({
        user_id: user.id,
        record_date: d,
        ...(input.flow ? { flow: input.flow } : {}),
      }));
      const { error } = await supabase
        .from("menstrual_records")
        .upsert(rows, { onConflict: "user_id,record_date" });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteDay(adult: boolean) {
  const invalidate = useInvalidateRecords();
  return useMutation({
    mutationFn: async (date: string) => {
      const ops: PromiseLike<{ error: unknown }>[] = [
        supabase.from("menstrual_records").delete().eq("record_date", date),
        supabase.from("symptom_records").delete().eq("record_date", date),
      ];
      if (adult) ops.push(supabase.from("sexual_activity_records").delete().eq("record_date", date));
      const results = await Promise.all(ops);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<
          Profile,
          "full_name" | "birth_date" | "typical_cycle_length" | "typical_period_length" | "show_fertile_window"
        >
      > & { id: string },
    ) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("profiles").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile }),
  });
}
