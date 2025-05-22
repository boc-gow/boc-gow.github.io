"use strict";

if (new URLSearchParams(location.search).get("admin") !== null) {
  const parsenum = (s) => {
    const i = parseInt(s.replaceAll(",", ""));
    const short =
      i >= 1000000 ? `${i / 1000000}m` : i >= 1000 ? `${i / 1000}k` : `${i}`;
    return {
      string: s,
      int: i,
      shortString: short,
    };
  };

  const resourcereqs = [...document.querySelectorAll(".resourcereqs")].map(
    (x) => {
      const elems = x.children;
      return {
        rank: elems[0].innerText,
        gold: parsenum(elems[1].innerText),
        seals: parsenum(elems[2].innerText),
        trophies: parsenum(elems[3].innerText),
      };
    }
  );

  const simplereqs = [...document.querySelectorAll(".simplereq")].map((x) => {
    const elems = x.children;
    return {
      event: elems[0].innerText,
      req: elems[1].innerText,
      remember: x.dataset.remember,
    };
  });

  const elem = (tagName, props, ...children) => {
    const el = Object.assign(document.createElement(tagName), props);
    el.replaceChildren(...children);
    return el;
  };

  const refreshers = [];
  const refresh = () => refreshers.forEach(f => f());

  const goldmsg = elem("input", { disabled: "true", value: "Mags takes care of it :)", oninput: refresh });
  const goldcheck = elem(
    "input",
    {
      type: "checkbox",
      onchange: (e) => {
        goldmsg.disabled = !e.target.checked;
        refresh();
      }
    }
  );

  const goldstr = () =>
    goldcheck.checked ? ` NO GOLD WEEK! ${goldmsg.value}` : ` Gold: ${resourcereqs.map((x) => x.gold.shortString).join("/")}`;

  const guildMessage = (eventString) => {
    let str = `¥¥¥ Honour channel = 801: ${eventString}`;
    str += goldstr();
    str += ` Trophies: ${resourcereqs
      .map((x) => x.trophies.shortString)
      .join("/")}`;
    str += ` according to tier level.`;
    return str;
  };

  const copyable = (pre) => {
    const span = elem("span");
    const status = (s) => {
      span.innerText = s;
      setTimeout(() => span.innerText = "", 1000);
    };
    const click = () => {
      navigator.clipboard.writeText(pre.innerText).then(
        () => status("✔"),
        (err) => {
          status("✘");
          console.error('Async: Could not copy text: ', err);
        }
      );
    };
    const div = elem(
      "div",
      {},
      pre,
      elem("button", { onclick: click }, "📋"),
      span
    );
    return div;
  };

  const refreshable = (f) => {
    const pre = elem("pre");
    const refresh = () => pre.innerText = f();
    refreshers.push(refresh);
    return pre;
  };

  const elems = [
    elem("h2", {}, "Guild Admin Stuff"),
    elem("label", {}, "No gold: ", goldcheck),
    elem("label", {}, "No gold message: ", goldmsg)
  ];
  
  for (const req of simplereqs) {
    elems.push(
      elem("h3", {}, req.event),
      elem("p", {}, "Guild message:"),
      copyable(refreshable(() => guildMessage(`${req.event}: Minimum ${req.req} per member.`))),
      elem("p", {}, "Discord message:"),
      copyable(refreshable(() => `@everyone ${req.event}: Minimum ${req.req} per member.\nRemember to use the event ${req.remember} :)`))
    );
  }

  const eventName = elem("input", { defaultValue: "<event name>" });
  const players = elem("input", {
    type: "number",
    defaultValue: "30",
    min: "1",
    max: "30",
    step: "1",
  });

  elems.push(
    elem("h3", {}, "World Event"),
    elem(
      "p",
      {},
      elem("label", {}, "Event name: ", eventName),
      elem("label", {}, "Guild members: ", players)
    )
  );
  const stages = [];
  for (let i = 1; i < 17; i++) {
    const stage = elem("input", {
      type: "number",
      min: "0",
      step: "1",
    });
    stages.push(stage);
    elems.push(elem("label", {}, `Stage ${i}: `, stage));
  }
  const ol = elem("ul");
  const guild = elem("pre");
  const discord = elem("pre");
  elems.push(
    ol,
    elem("p", {}, "Guild message:"),
    copyable(guild),
    elem("p", {}, "Discord message:"),
    copyable(discord)
  );
  
  const update = () => {
    let first12 = 0;
    let all16 = 0;
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const num = parseInt(stage.value);
      if (!isNaN(num)) {
        all16 += num;
        if (i < 12) {
          first12 += num;
        }
      }
      const playerCount = parseInt(players.value);
      const minimum = Math.ceil((first12 / playerCount) * 0.90);
      const tocomplete = Math.ceil(all16 / playerCount);
      ol.replaceChildren(
        elem("li", {}, `Total for first 12 stages: ${first12} points`),
        elem("li", {}, `Total for all 16 stages: ${all16} points`),
        elem("li", {}, `Minimum per member: ceil((${first12} points / ${playerCount}) * 0.90) = ${minimum} points`),
        elem("li", {}, `Per member to complete: ceil(${all16} points / ${playerCount}) = ${tocomplete} points`),
      );
      guild.innerText = guildMessage(`${eventName.value}. Minimum ${minimum} points per member.`);
      discord.innerText = `@everyone ${eventName.value}: Minimum ${minimum} points per member.\nTo complete: ${tocomplete} points per member.\n(Total: ${all16} points.)`;
    }
  };
  refreshers.push(update);
  eventName.oninput = refresh;
  players.oninput = refresh;
  for (const stage of stages) {
    stage.oninput = refresh;
  }
  
  document.body.append(...elems);
  refresh();
}
