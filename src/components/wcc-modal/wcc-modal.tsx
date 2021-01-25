import {
  Component,
  h,
  Prop,
  Event,
  EventEmitter,
  Fragment,
  State,
  Method,
} from "@stencil/core";
import { HostElement } from "../../decorators";

import { getModalContent } from "./wcc-modal-utils";

@Component({
  tag: "wcc-modal",
  styleUrls: {
    default: "../../styles/wcc-modal/wcc-modal.scss",
  },
  shadow: true,
})
export class WccModal {
  @HostElement() private host: HTMLElement;

  @State() isLoading: boolean = false;
  @State() isVisible: boolean = false;
  @State() content: string;

  /**
   * The name of the model that will be loaded. The generated path will have the format ${basePath}/modals/${modalName}.html
   */
  @Prop({ reflect: true }) modalName: string;

  /**
   * The text that will be shown in the modal's header, if neither the "title" slot nor modalTitleContent are provided
   */
  @Prop({ reflect: true }) modalTitle: string;

  /**
   * The content that can be shown in the header, if provided and the "title" slot is missing from the content.
   */
  @Prop({ reflect: true }) modalTitleContent: string;

  /**
   * The content that can be shown in the footer, if provided and the "footer" slot is missing from the content.
   */
  @Prop({ reflect: true }) modalFooterContent: string;

  /**
   * The text that will appear on the footer close button
   * (if neither the "footer" slot nor modalFooterContent are provided)
   */
  @Prop({ reflect: true }) closeButtonText: string = "Close";

  /**
   * The text that will appear on the footer confirm button
   * (if neither the "footer" slot nor modalFooterContent are provided)
   */
  @Prop({ reflect: true }) confirmButtonText: string = "Ok";

  /**
   * Sets if the popup is centered on the screen or if it appear at the top of the screen
   */
  @Prop({ reflect: true }) centered: boolean = true;

  /**
   * Sets if the modal will automatically show when the element is constructed
   */
  @Prop({ reflect: true, mutable: true }) autoShow: boolean = true;

  /**
   * Sets if the modal will automatically close when the user clicks outside of it
   */
  @Prop({ reflect: true }) autoClose: boolean = true;

  /**
   * Event that fires when the modal is initialised (after the modal content was successfully loaded)
   */
  @Event() initialised: EventEmitter<HTMLElement>;

  /**
   * Event that fires when the confirm button is pressed (only when the default footer is shown)
   */
  @Event() confirmed: EventEmitter<any>;

  /**
   * Event that fires when the modal is pressed (only when the default footer is shown).
   * The event will be passed with a boolean value to specify if the popup was closed due to a button press (true) or a click outside of the popup (false)
   */
  @Event() closed: EventEmitter<boolean>;

  async componentWillLoad() {
    this.isLoading = true;
    if (this.autoShow) {
      this.isVisible = true;
    }

    this.content = await getModalContent(this.modalName);
    this.isLoading = false;

    this.host.innerHTML = this.content;
    this.initialised.emit(this.host);
  }

  /**
   * Method that shows the modal.
   */
  @Method()
  async show() {
    this.isVisible = true;
  }

  /**
   * Method that hides the modal.
   */
  @Method()
  async hide() {
    this.isVisible = false;
  }

  /**
   * Method that completely removes the modal from the DOM.
   */
  @Method()
  async destroy() {
    this.host.remove();
  }

  handleBackdropClick(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (this.autoClose && e.target === e.currentTarget) {
      this.closed.emit(false);
    }
  }

  handleClose(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.closed.emit(true);
  }

  handleConfirm(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.confirmed.emit();
  }

  hasSlot(slotName) {
    return !!this.host.querySelector(`[slot="${slotName}"]`);
  }

  hasTitleSlot() {
    return !!this.host.querySelector('[slot="title"]');
  }

  hasFooterSlot() {
    return !!this.host.querySelector('[slot="footer"]');
  }

  private getTitleContent() {
    if (this.hasSlot("title")) return <slot name="title" />;
    if (this.modalTitleContent)
      return <div innerHTML={this.modalTitleContent}></div>;
    return <h2 class="modal-title">{this.modalTitle}</h2>;
  }

  private getFooterContent() {
    if (this.hasSlot("footer")) return <slot name="footer" />;
    if (this.modalFooterContent)
      return <div innerHTML={this.modalFooterContent}></div>;
    return (
      <Fragment>
        <button
          type="button"
          class="btn btn-secondary"
          onClick={this.handleClose.bind(this)}
        >
          {this.closeButtonText}
        </button>

        <button
          type="button"
          class="btn btn-primary"
          onClick={this.handleConfirm.bind(this)}
        >
          {this.confirmButtonText}
        </button>
      </Fragment>
    );
  }

  render() {
    if (!this.isVisible) return null;

    return (
      <div
        class="modal fade show"
        tabindex="-1"
        role="dialog"
        onClick={this.handleBackdropClick.bind(this)}
      >
        <div
          class={`modal-dialog ${this.centered ? "centered" : ""} `}
          role="document"
        >
          <div class="modal-content">
            <div class="modal-header">
              {this.getTitleContent()}

              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
                onClick={this.handleClose.bind(this)}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            {this.isLoading ? (
              <div class="modal-body">
                <wcc-spinner />
              </div>
            ) : (
              <Fragment>
                <div class="modal-body">
                  <slot />
                </div>

                <div class="modal-footer">{this.getFooterContent()}</div>
              </Fragment>
            )}
          </div>
        </div>
      </div>
    );
  }
}

WccModal;
