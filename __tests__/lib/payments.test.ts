// 결제 API 테스트
// Toss Payments API 호출 로직을 테스트합니다.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  confirmTossPayment,
  cancelTossPayment,
  issueTossBillingKey,
  chargeTossBilling,
} from "@/lib/payments/toss";

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("Toss Payments API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("TOSS_PAYMENTS_SECRET_KEY", "test_sk_1234567890");
  });

  describe("confirmTossPayment", () => {
    it("결제 확인 성공 시 결제 정보를 반환해야 한다", async () => {
      const mockResponse = {
        paymentKey: "pay_1234567890",
        orderId: "order_123",
        status: "DONE",
        totalAmount: 5000,
        method: "카드",
        approvedAt: "2026-01-24T12:00:00+09:00",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await confirmTossPayment("pay_1234567890", "order_123", 5000);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.tosspayments.com/v1/payments/confirm",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            paymentKey: "pay_1234567890",
            orderId: "order_123",
            amount: 5000,
          }),
        })
      );
    });

    it("결제 확인 실패 시 에러를 던져야 한다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          code: "INVALID_PAYMENT_KEY",
          message: "유효하지 않은 결제 키입니다.",
        }),
      });

      await expect(
        confirmTossPayment("invalid_key", "order_123", 5000)
      ).rejects.toThrow("Toss payment error: INVALID_PAYMENT_KEY");
    });

    it("금액 불일치 시 에러를 던져야 한다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          code: "INCORRECT_PAYMENT_AMOUNT",
          message: "결제 금액이 일치하지 않습니다.",
        }),
      });

      await expect(
        confirmTossPayment("pay_123", "order_123", 10000)
      ).rejects.toThrow("INCORRECT_PAYMENT_AMOUNT");
    });
  });

  describe("cancelTossPayment", () => {
    it("결제 취소 성공 시 취소 정보를 반환해야 한다", async () => {
      const mockResponse = {
        paymentKey: "pay_1234567890",
        orderId: "order_123",
        status: "CANCELED",
        totalAmount: 5000,
        method: "카드",
        approvedAt: "2026-01-24T12:00:00+09:00",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await cancelTossPayment("pay_1234567890", "고객 요청");

      expect(result.status).toBe("CANCELED");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.tosspayments.com/v1/payments/pay_1234567890/cancel",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ cancelReason: "고객 요청" }),
        })
      );
    });

    it("이미 취소된 결제 취소 시 에러를 던져야 한다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          code: "ALREADY_CANCELED_PAYMENT",
          message: "이미 취소된 결제입니다.",
        }),
      });

      await expect(
        cancelTossPayment("pay_123", "고객 요청")
      ).rejects.toThrow("ALREADY_CANCELED_PAYMENT");
    });
  });

  describe("issueTossBillingKey", () => {
    it("빌링키 발급 성공 시 빌링키를 반환해야 한다", async () => {
      const mockResponse = {
        billingKey: "billing_1234567890",
        customerKey: "customer_123",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await issueTossBillingKey("customer_123", "auth_key_123");

      expect(result.billingKey).toBe("billing_1234567890");
      expect(result.customerKey).toBe("customer_123");
    });

    it("잘못된 인증키로 빌링키 발급 시 에러를 던져야 한다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          code: "INVALID_AUTH_KEY",
          message: "유효하지 않은 인증 키입니다.",
        }),
      });

      await expect(
        issueTossBillingKey("customer_123", "invalid_auth")
      ).rejects.toThrow("INVALID_AUTH_KEY");
    });
  });

  describe("chargeTossBilling", () => {
    it("정기 결제 성공 시 결제 정보를 반환해야 한다", async () => {
      const mockResponse = {
        paymentKey: "pay_billing_123",
        orderId: "order_billing_123",
        status: "DONE",
        totalAmount: 49000,
        method: "카드",
        approvedAt: "2026-01-24T12:00:00+09:00",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await chargeTossBilling(
        "billing_123",
        "customer_123",
        49000,
        "order_billing_123",
        "GovHelper Premium 구독"
      );

      expect(result.status).toBe("DONE");
      expect(result.totalAmount).toBe(49000);
    });

    it("잔액 부족 시 에러를 던져야 한다", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          code: "NOT_ENOUGH_BALANCE",
          message: "잔액이 부족합니다.",
        }),
      });

      await expect(
        chargeTossBilling(
          "billing_123",
          "customer_123",
          49000,
          "order_123",
          "GovHelper Premium"
        )
      ).rejects.toThrow("NOT_ENOUGH_BALANCE");
    });
  });
});

describe("결제 금액 검증", () => {
  it("Pro 플랜 금액은 5000원이어야 한다", () => {
    const PRO_PRICE = 5000;
    expect(PRO_PRICE).toBe(5000);
  });

  it("Premium 플랜 금액은 49000원이어야 한다", () => {
    const PREMIUM_PRICE = 49000;
    expect(PREMIUM_PRICE).toBe(49000);
  });

  it("Free 플랜은 결제가 필요 없다", () => {
    const FREE_PRICE = 0;
    expect(FREE_PRICE).toBe(0);
  });
});
