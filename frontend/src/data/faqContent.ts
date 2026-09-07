export interface FaqItem {
  question: string
  answer: string
}

// Static help copy shown on the FAQ screen (linked from Home's "Need help?"
// section). Not diagnostic data and not backend-sourced -- these are general
// answers, independent of any particular scan.
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'My internet light is red or off',
    answer:
      "This usually means your router isn't receiving a signal from your provider. Start with Scan My Router -- we'll read the light and walk you through fixing it step by step.",
  },
  {
    question: "My router has no power / lights won't turn on",
    answer:
      'Check that the power cable is firmly plugged in at both the router and the wall outlet, and that the outlet itself has power (try another device in it). If the router still shows no lights after that, it may need to be replaced.',
  },
  {
    question: 'My Wi-Fi light is off but I can still see the internet light on',
    answer:
      "Your connection to the internet is fine, but Wi-Fi broadcasting is off. Most routers have a physical Wi-Fi on/off button or switch on the back or side -- check that it's pressed in. If there isn't one, restarting the router usually turns Wi-Fi back on.",
  },
  {
    question: 'My internet keeps disconnecting',
    answer:
      'This is often a loose cable or an overheating router. Check that all cables are fully seated, move the router somewhere with open airflow, and avoid stacking it under other equipment. If it keeps happening after that, scan your router so we can check for a specific fault light.',
  },
  {
    question: 'My internet is very slow',
    answer:
      "Slow speeds usually aren't visible in the router's lights, so we can't diagnose them from a photo. Try restarting your router first, then run a speed test from your device. If it's still slow after a restart, contact support so an agent can check for a network issue in your area.",
  },
  {
    question: "None of the steps are fixing it",
    answer:
      "That's exactly what escalation is for. Finish the troubleshooting steps we give you and you'll be offered the option to contact support -- your diagnosis and everything you've already tried is saved, so you won't have to repeat it.",
  },
]
