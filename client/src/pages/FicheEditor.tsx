import { Button } from "@/components/ui/button";
import { prepareImage } from "@/lib/imageProcessing";
import { trpc } from "@/lib/trpc";
import type { MediaKind } from "@shared/mediaRules";
import { getPlanFeatures, type PlanName } from "@shared/planFeatures";
import { ArrowLeft, Check, Eye, ImagePlus, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";