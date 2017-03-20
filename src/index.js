import snabbdom from "snabbdom";
import classModule from "snabbdom/modules/class";
import propsModule from "snabbdom/modules/props";
import styleModule from "snabbdom/modules/style";
import eventlistenersModule from "snabbdom/modules/eventlisteners";
import h from "snabbdom/h";
import { css } from "glamor";
import flyd from "flyd";

const patch = snabbdom.init([
  classModule,
  propsModule,
  styleModule,
  eventlistenersModule
]);

const style = css({
  color: "blue"
});

const root = document.createElement("div");
document.body.appendChild(root);

patch(root, h("div", { class: { [style]: true } }, "hello world"));
