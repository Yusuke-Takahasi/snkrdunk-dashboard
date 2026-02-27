'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { FeeSettingInput } from './FeeSettingInput';
import { saveFeeSettingsAction } from './actions';
import type { FeeSettings, PsaPlanKey } from '../../../utils/appSettings';
import { PSA_PLAN_META } from '../../../utils/appSettings';

type FeeSettingsFormProps = {
  initial: FeeSettings;
};

export function FeeSettingsForm({ initial }: FeeSettingsFormProps) {
  const router = useRouter();
  const [fee, setFee] = useState<FeeSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const update = <K extends keyof FeeSettings>(key: K, value: FeeSettings[K]) => {
    setFee((prev) => ({ ...prev, [key]: value }));
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await saveFeeSettingsAction(fee);
      if (error) {
        setMessage({ type: 'error', text: error });
        return;
      }
      setMessage({ type: 'ok', text: '保存しました' });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="min-w-0">
        <h3 className="text-base font-bold text-slate-900 mb-2">販売手数料</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
          <FeeSettingInput
            label="メルカリ手数料(%)"
            value={fee.mercariFeePercent}
            onChange={(v) => update('mercariFeePercent', v)}
            step={0.5}
            min={0}
            suffix="%"
          />
          <FeeSettingInput
            label="スニダン手数料(%)"
            value={fee.snkrdunkFeePercent}
            onChange={(v) => update('snkrdunkFeePercent', v)}
            step={0.5}
            min={0}
            suffix="%"
          />
        </div>
      </section>

      <section className="min-w-0">
        <h3 className="text-base font-bold text-slate-900 mb-2">PSA鑑定料金</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 min-w-0">
          <div className="space-y-1">
            <FeeSettingInput
              label="バリューバルク(円)"
              value={fee.psaValueBulk}
              onChange={(v) => update('psaValueBulk', v)}
              step={10}
              min={0}
              suffix="円"
            />
            <p className="text-xs text-slate-500">
              予定納期: {PSA_PLAN_META.psaValueBulk.leadTimeShort}
            </p>
            <p className="text-xs text-slate-500">
              {PSA_PLAN_META.psaValueBulk.leadTimeDetail}
            </p>
            <p className="text-xs text-slate-500">
              申告価格: {PSA_PLAN_META.psaValueBulk.declaredPrice}
            </p>
          </div>
          <div className="space-y-1">
            <FeeSettingInput
              label="バリュー(円)"
              value={fee.psaValue}
              onChange={(v) => update('psaValue', v)}
              step={10}
              min={0}
              suffix="円"
            />
            <p className="text-xs text-slate-500">
              予定納期: {PSA_PLAN_META.psaValue.leadTimeShort}
            </p>
            <p className="text-xs text-slate-500">
              {PSA_PLAN_META.psaValue.leadTimeDetail}
            </p>
            <p className="text-xs text-slate-500">
              申告価格: {PSA_PLAN_META.psaValue.declaredPrice}
            </p>
          </div>
          <div className="space-y-1">
            <FeeSettingInput
              label="バリュープラス(円)"
              value={fee.psaValuePlus}
              onChange={(v) => update('psaValuePlus', v)}
              step={10}
              min={0}
              suffix="円"
            />
            <p className="text-xs text-slate-500">
              予定納期: {PSA_PLAN_META.psaValuePlus.leadTimeShort}
            </p>
            <p className="text-xs text-slate-500">
              {PSA_PLAN_META.psaValuePlus.leadTimeDetail}
            </p>
            <p className="text-xs text-slate-500">
              申告価格: {PSA_PLAN_META.psaValuePlus.declaredPrice}
            </p>
          </div>
          <div className="space-y-1">
            <FeeSettingInput
              label="バリューマックス(円)"
              value={fee.psaValueMax}
              onChange={(v) => update('psaValueMax', v)}
              step={10}
              min={0}
              suffix="円"
            />
            <p className="text-xs text-slate-500">
              予定納期: {PSA_PLAN_META.psaValueMax.leadTimeShort}
            </p>
            <p className="text-xs text-slate-500">
              {PSA_PLAN_META.psaValueMax.leadTimeDetail}
            </p>
            <p className="text-xs text-slate-500">
              申告価格: {PSA_PLAN_META.psaValueMax.declaredPrice}
            </p>
          </div>
          <div className="space-y-1">
            <FeeSettingInput
              label="レギュラー(円)"
              value={fee.psaRegular}
              onChange={(v) => update('psaRegular', v)}
              step={10}
              min={0}
              suffix="円"
            />
            <p className="text-xs text-slate-500">
              予定納期: {PSA_PLAN_META.psaRegular.leadTimeShort}
            </p>
            <p className="text-xs text-slate-500">
              {PSA_PLAN_META.psaRegular.leadTimeDetail}
            </p>
            <p className="text-xs text-slate-500">
              申告価格: {PSA_PLAN_META.psaRegular.declaredPrice}
            </p>
          </div>
          <div className="space-y-1">
            <FeeSettingInput
              label="エクスプレス(円)"
              value={fee.psaExpress}
              onChange={(v) => update('psaExpress', v)}
              step={10}
              min={0}
              suffix="円"
            />
            <p className="text-xs text-slate-500">
              予定納期: {PSA_PLAN_META.psaExpress.leadTimeShort}
            </p>
            <p className="text-xs text-slate-500">
              {PSA_PLAN_META.psaExpress.leadTimeDetail}
            </p>
            <p className="text-xs text-slate-500">
              申告価格: {PSA_PLAN_META.psaExpress.declaredPrice}
            </p>
          </div>
        </div>
      </section>

      {message && (
        <p
          className={`text-sm font-medium ${
            message.type === 'ok' ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 min-h-[44px]"
      >
        {saving ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            保存中…
          </>
        ) : (
          '保存する'
        )}
      </button>
    </form>
  );
}
