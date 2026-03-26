"use client";

import { PIPELINE_STAGES } from "@/lib/theme";
import {
  Upload,
  BookOpen,
  Wrench,
  Route,
  Play,
  CheckCircle,
  Award,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STAGE_ICONS = [Upload, BookOpen, Wrench, Route, Play, CheckCircle, Award];

const COLORS = {
  gold: "#c9a84c",
  midnight: "#0d1117",
  cream: "#f5f0e1",
  red: "#c41e3a",
  dimBorder: "#1e2d3d",
};

interface PipelineTrackerProps {
  currentStage: number; // -1 = not started, 0-6 = stage index
  stageStatuses: Array<"pending" | "running" | "completed" | "error">;
}

function StageNode({
  index,
  status,
  isCurrent,
}: {
  index: number;
  status: "pending" | "running" | "completed" | "error";
  isCurrent: boolean;
}) {
  const stage = PIPELINE_STAGES[index];
  const Icon = STAGE_ICONS[index];

  const borderColor =
    status === "completed"
      ? COLORS.gold
      : status === "running"
        ? COLORS.gold
        : status === "error"
          ? COLORS.red
          : COLORS.dimBorder;

  const bgColor =
    status === "completed"
      ? `${COLORS.gold}22`
      : status === "error"
        ? `${COLORS.red}15`
        : "transparent";

  const iconColor =
    status === "completed"
      ? COLORS.gold
      : status === "running"
        ? COLORS.gold
        : status === "error"
          ? COLORS.red
          : `${COLORS.cream}30`;

  return (
    <div className="flex flex-col items-center gap-1.5 relative z-10">
      {/* Horse emoji above running stage */}
      <AnimatePresence>
        {isCurrent && status === "running" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              y: { repeat: Infinity, duration: 0.8, ease: "easeInOut" },
              opacity: { duration: 0.3 },
            }}
            className="absolute -top-8 text-lg"
          >
            <span role="img" aria-label="horse racing">
              🏇
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Node circle */}
      <motion.div
        className="relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 shrink-0"
        style={{
          borderColor,
          backgroundColor: bgColor,
        }}
        animate={
          status === "running"
            ? {
                boxShadow: [
                  `0 0 0px ${COLORS.gold}00`,
                  `0 0 12px ${COLORS.gold}60`,
                  `0 0 0px ${COLORS.gold}00`,
                ],
              }
            : {}
        }
        transition={
          status === "running"
            ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
            : {}
        }
      >
        {status === "completed" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Check className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLORS.gold }} />
          </motion.div>
        ) : status === "running" ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          >
            <Loader2
              className="w-5 h-5 md:w-6 md:h-6"
              style={{ color: COLORS.gold }}
            />
          </motion.div>
        ) : status === "error" ? (
          <X className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLORS.red }} />
        ) : (
          <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: iconColor }} />
        )}
      </motion.div>

      {/* Labels */}
      <div className="flex flex-col items-center text-center">
        <span
          className="text-[10px] md:text-xs font-semibold tracking-wide uppercase"
          style={{
            color:
              status === "completed" || status === "running"
                ? COLORS.cream
                : status === "error"
                  ? COLORS.red
                  : `${COLORS.cream}50`,
          }}
        >
          {stage.name}
        </span>
        <span
          className="text-[8px] md:text-[10px] hidden sm:block max-w-[80px]"
          style={{
            color:
              status === "completed" || status === "running"
                ? `${COLORS.cream}90`
                : `${COLORS.cream}35`,
          }}
        >
          {stage.subtitle}
        </span>
      </div>
    </div>
  );
}

function ConnectingLine({
  filled,
  isActive,
}: {
  filled: boolean;
  isActive: boolean;
}) {
  return (
    <div className="flex-1 h-0.5 relative self-start mt-5 md:mt-6 min-w-[20px]">
      {/* Background line */}
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: COLORS.dimBorder }}
      />
      {/* Filled overlay */}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ backgroundColor: COLORS.gold }}
        initial={{ width: "0%" }}
        animate={{
          width: filled ? "100%" : isActive ? "50%" : "0%",
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

export default function PipelineTracker({
  currentStage,
  stageStatuses,
}: PipelineTrackerProps) {
  return (
    <div
      className="w-full rounded-xl border p-4 md:p-6"
      style={{
        borderColor: `${COLORS.cream}1a`,
        backgroundColor: `${COLORS.cream}05`,
      }}
    >
      {/* Furlong label */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="text-[10px] md:text-xs font-medium uppercase tracking-widest"
          style={{ color: `${COLORS.gold}99` }}
        >
          Pipeline — 7 Furlongs
        </span>
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: `${COLORS.cream}10` }}
        />
        <span
          className="text-[10px] md:text-xs tabular-nums"
          style={{ color: `${COLORS.cream}50` }}
        >
          {stageStatuses.filter((s) => s === "completed").length}/7
        </span>
      </div>

      {/* Desktop: horizontal layout */}
      <div className="hidden sm:flex items-start gap-0">
        {PIPELINE_STAGES.map((_, i) => (
          <div key={i} className="contents">
            <StageNode
              index={i}
              status={stageStatuses[i] ?? "pending"}
              isCurrent={i === currentStage}
            />
            {i < PIPELINE_STAGES.length - 1 && (
              <ConnectingLine
                filled={stageStatuses[i] === "completed"}
                isActive={stageStatuses[i + 1] === "running"}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: vertical layout */}
      <div className="flex sm:hidden flex-col gap-0">
        {PIPELINE_STAGES.map((stage, i) => {
          const status = stageStatuses[i] ?? "pending";
          const Icon = STAGE_ICONS[i];
          const isCurrent = i === currentStage;

          const borderColor =
            status === "completed"
              ? COLORS.gold
              : status === "running"
                ? COLORS.gold
                : status === "error"
                  ? COLORS.red
                  : COLORS.dimBorder;

          const iconColor =
            status === "completed"
              ? COLORS.gold
              : status === "running"
                ? COLORS.gold
                : status === "error"
                  ? COLORS.red
                  : `${COLORS.cream}30`;

          return (
            <div key={i} className="flex items-stretch gap-3">
              {/* Vertical line + node */}
              <div className="flex flex-col items-center">
                <motion.div
                  className="w-8 h-8 rounded-full flex items-center justify-center border-2 shrink-0 relative"
                  style={{
                    borderColor,
                    backgroundColor:
                      status === "completed"
                        ? `${COLORS.gold}22`
                        : status === "error"
                          ? `${COLORS.red}15`
                          : "transparent",
                  }}
                  animate={
                    status === "running"
                      ? {
                          boxShadow: [
                            `0 0 0px ${COLORS.gold}00`,
                            `0 0 12px ${COLORS.gold}60`,
                            `0 0 0px ${COLORS.gold}00`,
                          ],
                        }
                      : {}
                  }
                  transition={
                    status === "running"
                      ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                      : {}
                  }
                >
                  {isCurrent && status === "running" && (
                    <motion.span
                      className="absolute -left-7 text-sm"
                      animate={{ x: [0, -2, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.8,
                        ease: "easeInOut",
                      }}
                    >
                      🏇
                    </motion.span>
                  )}
                  {status === "completed" ? (
                    <Check className="w-4 h-4" style={{ color: COLORS.gold }} />
                  ) : status === "running" ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.2,
                        ease: "linear",
                      }}
                    >
                      <Loader2
                        className="w-4 h-4"
                        style={{ color: COLORS.gold }}
                      />
                    </motion.div>
                  ) : status === "error" ? (
                    <X className="w-4 h-4" style={{ color: COLORS.red }} />
                  ) : (
                    <Icon className="w-4 h-4" style={{ color: iconColor }} />
                  )}
                </motion.div>

                {/* Vertical connecting line */}
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="w-0.5 flex-1 min-h-[16px] relative">
                    <div
                      className="absolute inset-0"
                      style={{ backgroundColor: COLORS.dimBorder }}
                    />
                    <motion.div
                      className="absolute inset-x-0 top-0"
                      style={{ backgroundColor: COLORS.gold }}
                      initial={{ height: "0%" }}
                      animate={{
                        height:
                          status === "completed"
                            ? "100%"
                            : stageStatuses[i + 1] === "running"
                              ? "50%"
                              : "0%",
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                )}
              </div>

              {/* Labels */}
              <div className="pb-4 pt-1">
                <span
                  className="text-xs font-semibold tracking-wide uppercase block"
                  style={{
                    color:
                      status === "completed" || status === "running"
                        ? COLORS.cream
                        : status === "error"
                          ? COLORS.red
                          : `${COLORS.cream}50`,
                  }}
                >
                  {stage.name}
                </span>
                <span
                  className="text-[10px]"
                  style={{
                    color:
                      status === "completed" || status === "running"
                        ? `${COLORS.cream}90`
                        : `${COLORS.cream}35`,
                  }}
                >
                  {stage.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
