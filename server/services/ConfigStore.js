import Promise from 'bluebird';
import {PrivateKey} from 'gxbjs';
import BoxService from './BoxService';
import ConnectService from './ConnectService';
import fs from 'fs';
import path from 'path';
import gui_config from '../../config';

let config_path = path.resolve(process.cwd(), './dist/config/config.json');

export default {
    init () {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                self.config = JSON.parse(fs.readFileSync(config_path, 'utf-8')) || {};
                resolve(self.config);
            } catch (ex) {
                reject(ex);
            }
        });
    },
    set (config) {
        let self = this;
        return new Promise((resolve, reject) => {
            try {
                fs.writeFileSync(config_path, JSON.stringify(config));
                self.config = config;
                resolve({
                    'message': '系统配置保存成功'
                });
            } catch (ex) {
                reject(ex);
            }
        });
    },
    change_config_env (env, config) {
        let self = this;
        let witnesses = env === 'production' ? gui_config.build.witnesses : gui_config.dev.witnesses;
        return new Promise((resolve, reject) => {
            // 停止GXB-BOX-PM2
            BoxService.box_delete().then(() => {
                ConnectService.connect(witnesses, true, function () {
                    try {
                        let _config = JSON.parse(fs.readFileSync(config_path, 'utf-8'));
                        fs.writeFileSync(config_path, JSON.stringify(config));
                        self.config = config;
                        resolve({
                            'message': '系统切换配置成功',
                            'data': {
                                'old_config': _config,
                                'new_config': config
                            }
                        });
                    } catch (ex) {
                        reject(ex);
                    }
                });
            }).catch((ex) => {
                reject(ex);
            });
        });
    },
    get_merchant_private_key () {
        let config = this.config;
        return config.merchant && config.merchant.private_key ? PrivateKey.fromWif(config.merchant.private_key) : '';
    },
    get_datasource_private_key () {
        let config = this.config;
        return config.datasource && config.datasource.private_key ? PrivateKey.fromWif(config.datasource.private_key) : '';
    }
};
