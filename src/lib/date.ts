import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  parseISO,
  eachDayOfInterval,
  getISOWeek,
  getYear,
} from "date-fns";

const CHALLENGE_YEAR = 2026;
const CHALLENGE_START = new Date(CHALLENGE_YEAR, 0, 1); // 2026-01-01
const CHALLENGE_END = new Date(CHALLENGE_YEAR, 11, 31); // 2026-12-31

export function getChallengeStart(): Date {
  return CHALLENGE_START;
}

export function getChallengeEnd(): Date {
  return CHALLENGE_END;
}

export function getChallengeYear(): number {
  return CHALLENGE_YEAR;
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(date, { weekStartsOn: 1 }), // Sunday
  };
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function getYearRange(): { start: Date; end: Date } {
  return {
    start: startOfYear(CHALLENGE_START),
    end: endOfYear(CHALLENGE_END),
  };
}

export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDateISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatMonth(date: Date): string {
  return format(date, "yyyy-MM");
}

export function formatWeekLabel(date: Date): string {
  const year = getYear(date);
  const week = getISOWeek(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function formatMonthLabel(date: Date): string {
  return format(date, "MMM yyyy");
}

export function getAllDaysInChallenge(): Date[] {
  const end = new Date(); // Up to today
  const cappedEnd = end > CHALLENGE_END ? CHALLENGE_END : end;
  return eachDayOfInterval({
    start: CHALLENGE_START,
    end: cappedEnd,
  });
}

export function getDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}

export function isWithinChallenge(date: Date): boolean {
  return date >= CHALLENGE_START && date <= CHALLENGE_END;
}

export function getDayOfYear(): number {
  const now = new Date();
  const start = new Date(CHALLENGE_YEAR, 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function getDaysInYear(): number {
  const isLeapYear =
    CHALLENGE_YEAR % 4 === 0 &&
    (CHALLENGE_YEAR % 100 !== 0 || CHALLENGE_YEAR % 400 === 0);
  return isLeapYear ? 366 : 365;
}
